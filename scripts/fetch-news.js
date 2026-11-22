// Collects the latest headlines from RSS feeds and saves them to news.json.
// Runs every day in GitHub Actions. Needs Node 18 or newer (no packages to install).
// Only headline, short summary, date and link are saved. Always link back to the original.

const fs = require("fs");
const path = require("path");

const OUTPUT = path.join(__dirname, "..", "news.json");
const PER_CATEGORY = 8;

const MUSIC_WORDS = /\b(music|album|song|songs|singer|band|concert|gig|rapper|rap|tour|festival|grammy|grammys|brit awards|chart|vinyl|dj|opera|orchestra)\b/i;

// Add, remove or change feeds here. "include" and "exclude" are optional word filters.
const FEEDS = [
  { category: "Football",   outlet: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/football/rss.xml" },
  { category: "Technology", outlet: "BBC News",  url: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
  { category: "Music",      outlet: "BBC News",  url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", include: MUSIC_WORDS },
  { category: "Arts",       outlet: "BBC News",  url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", exclude: MUSIC_WORDS }
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
  return s.replace(/\s+/g, " ").trim();
}

function tag(block, name) {
  const m = new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i").exec(block);
  return m ? m[1] : "";
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
    u.searchParams.delete("at_medium");
    u.searchParams.delete("at_campaign");
    return u.toString();
  } catch (e) { return ""; }
}

function parseRSS(xml, feed) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    const headline = clean(tag(b, "title"));
    const link = cleanLink(tag(b, "link"));
    if (!headline || !link) continue;
    const text = headline + " " + clean(tag(b, "description"));
    if (feed.include && !feed.include.test(text)) continue;
    if (feed.exclude && feed.exclude.test(text)) continue;
    const d = new Date(clean(tag(b, "pubDate")));
    items.push({
      headline,
      link,
      outlet: feed.outlet,
      category: feed.category,
      date: isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10),
      summary: shorten(clean(tag(b, "description")), 200)
    });
  }
  return items;
}

async function getFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "KelvinPortfolioNewsBot/1.0 (headline links only)" },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return parseRSS(await res.text(), feed);
}

async function main() {
  let previous = { items: [] };
  try { previous = JSON.parse(fs.readFileSync(OUTPUT, "utf8")); } catch (e) {}

  const all = [];
  let failures = 0;
  for (const feed of FEEDS) {
    try {
      const items = (await getFeed(feed)).slice(0, PER_CATEGORY);
      console.log(feed.category + ": " + items.length + " headlines");
      all.push(...items);
    } catch (err) {
      failures++;
      console.warn(feed.category + " failed (" + err.message + "). Keeping the previous headlines.");
      all.push(...(previous.items || []).filter((i) => i.category === feed.category));
    }
  }
  if (failures === FEEDS.length && !all.length) throw new Error("All feeds failed and there is nothing saved.");

  const seen = new Set();
  const items = all.filter((i) => (seen.has(i.link) ? false : seen.add(i.link)));
  fs.writeFileSync(OUTPUT, JSON.stringify({ updated: new Date().toISOString(), items }, null, 2) + "\n");
  console.log("Saved " + items.length + " headlines to news.json");
}

if (require.main === module) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
module.exports = { parseRSS, clean, cleanLink, shorten, FEEDS };
