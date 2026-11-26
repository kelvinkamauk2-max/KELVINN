// Collects the latest headlines from many RSS/Atom feeds and saves them to news.json.
// Runs every day in GitHub Actions. Needs Node 18 or newer (no packages to install).
// Only the headline, a short summary, the date and the link are saved. Always link back to the original.

const fs = require("fs");
const path = require("path");

const OUTPUT = path.join(__dirname, "..", "news.json");
const PER_FEED = 5;          // most items kept from one outlet
const PER_CATEGORY = 24;     // most items kept per category (newest first)
const MAX_AGE_DAYS = 10;     // older items are dropped from news.json
const ARCHIVE_DIR = path.join(__dirname, "..", "archive");
const ARCHIVE_DAYS = 365;    // daily archive files older than this are deleted

const MUSIC_WORDS = /\b(music|album|albums|song|songs|singer|band|concert|gig|rapper|rap|tour|festival|grammy|grammys|brit awards|chart|vinyl|dj|opera|orchestra)\b/i;
const FOOTBALL_WORDS = /\b(football|soccer|premier league|champions league|europa league|afcon|caf|fifa|uefa|world cup|la liga|bundesliga|serie a|ligue 1|harambee stars|gor mahia|afc leopards|kpl|goal|striker|midfielder|goalkeeper)\b/i;

// To add an outlet, add one line. To remove one, delete its line.
// "include" / "exclude" are optional word filters for feeds that mix topics.
const FEEDS = [
  // ---- Football ----
  { category: "Football", outlet: "BBC Sport",        url: "https://feeds.bbci.co.uk/sport/football/rss.xml" },
  { category: "Football", outlet: "The Guardian",     url: "https://www.theguardian.com/football/rss" },
  { category: "Football", outlet: "ESPN",             url: "https://www.espn.com/espn/rss/soccer/news" },
  { category: "Football", outlet: "Sky Sports",       url: "https://www.skysports.com/rss/12040" },
  { category: "Football", outlet: "CBS Sports",       url: "https://www.cbssports.com/rss/headlines/soccer/" },
  { category: "Football", outlet: "The Standard (Kenya)",  url: "https://www.standardmedia.co.ke/rss/sports.php", include: FOOTBALL_WORDS },
  { category: "Football", outlet: "Capital FM (Kenya)",    url: "https://www.capitalfm.co.ke/sports/feed/",       include: FOOTBALL_WORDS },

  // ---- Technology ----
  { category: "Technology", outlet: "BBC News",       url: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
  { category: "Technology", outlet: "The Verge",      url: "https://www.theverge.com/rss/index.xml" },
  { category: "Technology", outlet: "TechCrunch",     url: "https://techcrunch.com/feed/" },
  { category: "Technology", outlet: "Ars Technica",   url: "https://feeds.arstechnica.com/arstechnica/index" },
  { category: "Technology", outlet: "WIRED",          url: "https://www.wired.com/feed/rss" },
  { category: "Technology", outlet: "Engadget",       url: "https://www.engadget.com/rss.xml" },
  { category: "Technology", outlet: "The Guardian",   url: "https://www.theguardian.com/technology/rss" },
  { category: "Technology", outlet: "TechCabal",      url: "https://techcabal.com/feed/" },
  { category: "Technology", outlet: "Techpoint Africa", url: "https://techpoint.africa/feed/" },

  // ---- Music ----
  { category: "Music", outlet: "The Guardian",   url: "https://www.theguardian.com/music/rss" },
  { category: "Music", outlet: "NME",            url: "https://www.nme.com/feed" },
  { category: "Music", outlet: "Pitchfork",      url: "https://pitchfork.com/feed/feed-news/rss" },
  { category: "Music", outlet: "Rolling Stone",  url: "https://www.rollingstone.com/music/feed/" },
  { category: "Music", outlet: "Billboard",      url: "https://www.billboard.com/feed/" },
  { category: "Music", outlet: "Stereogum",      url: "https://www.stereogum.com/feed/" },
  { category: "Music", outlet: "BBC News",       url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", include: MUSIC_WORDS },

  // ---- Arts ----
  { category: "Arts", outlet: "The Guardian",   url: "https://www.theguardian.com/artanddesign/rss" },
  { category: "Arts", outlet: "ARTnews",        url: "https://www.artnews.com/feed/" },
  { category: "Arts", outlet: "Hyperallergic",  url: "https://hyperallergic.com/feed/" },
  { category: "Arts", outlet: "The New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml" },
  { category: "Arts", outlet: "Artsy",          url: "https://www.artsy.net/rss/news" },
  { category: "Arts", outlet: "BBC News",       url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", exclude: MUSIC_WORDS }
];

function decode(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

function clean(s) {
  s = (s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  s = decode(s).replace(/<[^>]*>/g, " ");
  s = decode(s); // some feeds escape their HTML twice
  return s.replace(/\s+/g, " ").trim();
}

function tag(block, name) {
  const m = new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i").exec(block);
  return m ? m[1] : "";
}

// Atom feeds keep the link in an attribute: <link href="..." rel="alternate"/>
function atomLink(block) {
  let fallback = "";
  for (const l of block.match(/<link\b[^>]*>/gi) || []) {
    const href = (/href=["']([^"']+)["']/i.exec(l) || [])[1];
    const rel = (/rel=["']([^"']+)["']/i.exec(l) || [])[1];
    if (!href) continue;
    if (!rel || rel === "alternate") return href;
    if (!fallback) fallback = href;
  }
  return fallback;
}

function shorten(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).replace(/[,;:.\s]+$/, "") + "…";
}

function cleanLink(raw) {
  raw = clean(raw);
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    ["at_medium", "at_campaign", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
      .forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch (e) { return ""; }
}

function parseFeed(xml, feed) {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  const cutoff = Date.now() - MAX_AGE_DAYS * 86400000;
  const items = [];
  for (const b of blocks) {
    const headline = clean(tag(b, "title"));
    const link = cleanLink(tag(b, "link")) || cleanLink(atomLink(b));
    if (!headline || !link) continue;
    const summaryRaw = clean(tag(b, "description") || tag(b, "summary") || tag(b, "content"));
    const text = headline + " " + summaryRaw;
    if (feed.include && !feed.include.test(text)) continue;
    if (feed.exclude && feed.exclude.test(text)) continue;
    const d = new Date(clean(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date")));
    const valid = !isNaN(d.getTime());
    if (valid && d.getTime() < cutoff) continue;
    items.push({
      headline,
      link,
      outlet: feed.outlet,
      category: feed.category,
      date: valid ? d.toISOString().slice(0, 10) : "",
      summary: shorten(summaryRaw, 200)
    });
  }
  return items.slice(0, PER_FEED);
}

async function getFeed(feed) {
  const res = await fetch(feed.url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KelvinPortfolioNewsBot/1.0; headline links only)",
      "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"
    },
    signal: AbortSignal.timeout(20000),
    redirect: "follow"
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return parseFeed(await res.text(), feed);
}

// Saves every headline into a file for the day it was published: archive/YYYY-MM-DD.json.
// Files from earlier runs are kept and merged, so each day's file grows into a full record.
function saveArchive(items, dir = ARCHIVE_DIR, today = new Date().toISOString().slice(0, 10)) {
  fs.mkdirSync(dir, { recursive: true });
  const byDay = {};
  items.forEach((i) => { const d = i.date || today; (byDay[d] = byDay[d] || []).push(i); });

  Object.keys(byDay).forEach((d) => {
    const file = path.join(dir, d + ".json");
    let existing = [];
    try { existing = JSON.parse(fs.readFileSync(file, "utf8")).items || []; } catch (e) {}
    const seen = new Set();
    const merged = existing.concat(byDay[d]).filter((i) => (seen.has(i.link) ? false : seen.add(i.link)));
    fs.writeFileSync(file, JSON.stringify({ date: d, items: merged }, null, 2) + "\n");
  });

  const cutoff = new Date(Date.parse(today) - ARCHIVE_DAYS * 86400000).toISOString().slice(0, 10);
  const days = fs.readdirSync(dir)
    .filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n))
    .map((n) => n.slice(0, 10))
    .filter((d) => {
      if (d >= cutoff) return true;
      fs.unlinkSync(path.join(dir, d + ".json"));
      return false;
    })
    .sort().reverse();
  fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify({ days }, null, 2) + "\n");
  return days;
}

async function main() {
  let previous = { items: [] };
  try { previous = JSON.parse(fs.readFileSync(OUTPUT, "utf8")); } catch (e) {}

  const results = await Promise.allSettled(FEEDS.map(getFeed));
  const all = [];
  const failed = [];
  results.forEach((r, i) => {
    const f = FEEDS[i];
    const label = f.category + " / " + f.outlet;
    if (r.status === "fulfilled" && r.value.length) {
      console.log("OK      " + label + ": " + r.value.length + " headlines");
      all.push(...r.value);
    } else {
      const why = r.status === "rejected" ? r.reason.message : "no matching headlines";
      console.warn("FAILED  " + label + " (" + why + ")");
      failed.push(label);
      all.push(...(previous.items || []).filter((x) => x.category === f.category && x.outlet === f.outlet).slice(0, PER_FEED));
    }
  });
  if (failed.length === FEEDS.length && !all.length) throw new Error("All feeds failed and nothing is saved.");

  // One copy of each link, newest first, capped per category.
  const seen = new Set();
  const unique = all.filter((i) => (seen.has(i.link) ? false : seen.add(i.link)));
  unique.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const count = {};
  const items = unique.filter((i) => {
    count[i.category] = (count[i.category] || 0) + 1;
    return count[i.category] <= PER_CATEGORY;
  });

  const days = saveArchive(unique);
  console.log("Archive now holds " + days.length + " day(s).");

  const report = { feeds_ok: FEEDS.length - failed.length, feeds_failed: failed };
  fs.writeFileSync(OUTPUT, JSON.stringify({ updated: new Date().toISOString(), report, items }, null, 2) + "\n");
  console.log("Saved " + items.length + " headlines. Feeds OK: " + report.feeds_ok + "/" + FEEDS.length);
}

if (require.main === module) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
module.exports = { parseFeed, clean, cleanLink, shorten, saveArchive, FEEDS };
