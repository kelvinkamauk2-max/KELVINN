// ===== Settings =====
// Paste your published Google Sheet CSV link between the quotes.
// (Google Sheets > File > Share > Publish to web > Sheet1 + CSV)
var SHEET_URL = "";

// Daily headlines file, rebuilt every day by the GitHub Action (scripts/fetch-news.js).
var NEWS_URL = "https://raw.githubusercontent.com/kelvinkamauk2-max/KELVINN/main/news.json";

// Order of the filter buttons in "What I’m following".
var CATEGORY_ORDER = ["Football", "Technology", "Music", "Arts"];

// ----- Tips and donations -----
// Fill in only the options you want. Anything left empty ("") is hidden, and if
// everything is empty the whole "Support my work" section stays hidden.
var DONATE = {
  // A PayPal link, for example "https://paypal.me/yourname"
  paypal: "",
  mpesa: {
    name: "",     // name that shows on M-Pesa, for example "Kelvin Kamau"
    phone: "",    // send-money number, for example "0712 345 678"
    till: "",     // Buy Goods till number
    paybill: "",  // Paybill business number
    account: ""   // account number to use with the Paybill
  }
};

// Sheet columns (row 1 headings, any order):
// headline | link | outlet | byline | date | summary | topics | category | mine | take
// date: "YYYY-MM" (for example 2026-03) or leave empty.
// mine: type "yes" if you wrote the story. Those rows go under "Selected work".
//       All other rows go to the "News desk".
// topics: separate with commas.
// take: your own one or two sentences about a headline. It shows as "My take".
//       To add a take to a BBC headline, paste that headline's link in the link column.

// Saved stories, shown even when the sheet cannot be loaded.
var BACKUP = [
  {
    headline: "Nakuru County channels resources towards mental health",
    link: "https://www.kenyanews.go.ke/nakuru-county-channels-resources-towards-mental-health/",
    outlet: "Kenya News Agency", byline: "Esther Mwangi and Kelvin Kamau", date: "", category: "News", mine: true,
    summary: "Nakuru County is putting more money into preventing and treating mental illness. Governor Lee Kinyanjui said 55 community health workers have been trained with USAID’s Tujenge Jamii programme, and psychiatric units now run in all 14 level four and five hospitals.",
    topics: ["Public health", "County government"]
  },
  {
    headline: "Matiang’i reigns on Nakuru terror gangs",
    link: "https://www.kenyanews.go.ke/kasarani-ocpd-appointed-nakuru-commander-over-escalating-criminal-activities/",
    outlet: "Kenya News Agency", byline: "Jane Ngugi and Kelvin Kamau", date: "", category: "News", mine: true,
    summary: "Interior CS Fred Matiang’i replaced Nakuru’s police commander after a wave of gang killings and vowed to pursue the gangs and those who fund them. A special squad had arrested 128 suspects.",
    topics: ["Security", "Policing"]
  },
  {
    headline: "Nakuru moves to promote conference tourism",
    link: "https://www.kenyanews.go.ke/nakuru-moves-to-promote-conference-tourism/",
    outlet: "Kenya News Agency", byline: "Esther Mwangi and Kelvin Kamau", date: "", category: "News", mine: true,
    summary: "Nakuru County is investing in conference tourism to help the industry recover from Covid-19. Trade CEC Francis Mwangi announced preparations for the Love Festival in Naivasha, expected to draw over 13,000 participants.",
    topics: ["Tourism", "Business"]
  },
  {
    headline: "Proliferation of oral nicotine products enhancing access to minors",
    link: "https://www.kenyanews.go.ke/proliferation-of-oral-nicotine-products-enhancing-access-to-minors/",
    outlet: "Kenya News Agency", byline: "Anne Mwale and Kelvin Kamau", date: "", category: "News", mine: true,
    summary: "Health experts warned that oral nicotine products are easy for school children and young people to get. Dr Joy Mugambi of Nakuru County’s Department of Health spoke at the launch of the county’s anti-tobacco campaign.",
    topics: ["Public health", "Youth"]
  }
];

// ===== Helpers =====
function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}
function safeUrl(u) {
  u = (u || "").trim();
  return /^https?:\/\//i.test(u) ? u : "";
}
function formatMonth(d) {
  var m = /^(\d{4})-(0[1-9]|1[0-2])(-\d{2})?$/.exec((d || "").trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
}

function formatDate(d) {
  d = (d || "").trim();
  var m = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.exec(d);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  return formatMonth(d);
}

// Reads CSV text, including quoted cells that contain commas or line breaks.
function parseCSV(text) {
  text = String(text || "").replace(/^\uFEFF/, "");
  var rows = [], row = [], field = "", quoted = false, i, ch;
  for (i = 0; i < text.length; i++) {
    ch = text.charAt(i);
    if (quoted) {
      if (ch === '"') {
        if (text.charAt(i + 1) === '"') { field += '"'; i++; } else { quoted = false; }
      } else { field += ch; }
    } else if (ch === '"') { quoted = true; }
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text.charAt(i + 1) === "\n") i++;
      row.push(field); field = ""; rows.push(row); row = [];
    } else { field += ch; }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function itemsFromRows(rows) {
  if (!rows.length) return [];
  var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
  var out = [];
  rows.slice(1).forEach(function (r) {
    var o = {};
    head.forEach(function (h, i) { o[h] = (r[i] || "").trim(); });
    if (!o.headline) return;
    out.push({
      headline: o.headline,
      link: safeUrl(o.link),
      outlet: o.outlet || "",
      byline: o.byline || "",
      date: o.date || "",
      summary: o.summary || "",
      topics: (o.topics || "").split(/[,;]/).map(function (t) { return t.trim(); }).filter(Boolean),
      category: o.category || "News",
      mine: /^(yes|y|true|1|mine)$/i.test(o.mine || ""),
      take: o.take || ""
    });
  });
  return out;
}

// Dated items first (newest first), undated items after, in sheet order.
function sortItems(list) {
  var dated = list.filter(function (x) { return formatMonth(x.date); });
  var undated = list.filter(function (x) { return !formatMonth(x.date); });
  dated.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  return dated.concat(undated);
}

// ===== Rendering =====
function storyBlock(s) {
  var art = el("article", "story");
  var side = el("div", "side");
  if (s.byline) {
    var by = el("p"); by.appendChild(el("strong", "", "By " + s.byline)); side.appendChild(by);
  }
  var line = [s.outlet, s.category].filter(Boolean).join(" · ");
  if (line) side.appendChild(el("p", "", line));
  var month = formatDate(s.date);
  if (month) { var p = el("p"); var t = el("time", "", month); t.setAttribute("datetime", s.date); p.appendChild(t); side.appendChild(p); }

  var main = el("div");
  var h = el("h3");
  if (s.link) {
    var a = el("a", "", s.headline); a.href = s.link; a.target = "_blank"; a.rel = "noopener"; h.appendChild(a);
  } else { h.textContent = s.headline; }
  main.appendChild(h);
  if (s.summary) main.appendChild(el("p", "sum", s.summary));
  if (s.topics.length) {
    var tags = el("ul", "tags");
    s.topics.forEach(function (x) { tags.appendChild(el("li", "", x)); });
    main.appendChild(tags);
  }
  if (s.link) {
    var read = el("a", "read", "Read the full story"); read.href = s.link; read.target = "_blank"; read.rel = "noopener"; main.appendChild(read);
  }
  art.appendChild(side); art.appendChild(main);
  return art;
}

function newsBlock(s) {
  var art = el("article", "item");
  var h = el("h3");
  if (s.link) {
    var a = el("a", "", s.headline); a.href = s.link; a.target = "_blank"; a.rel = "noopener"; h.appendChild(a);
  } else { h.textContent = s.headline; }
  art.appendChild(h);
  var meta = el("p", "meta");
  var parts = [s.outlet, s.category];
  meta.appendChild(document.createTextNode(parts.filter(Boolean).join(" · ")));
  var month = formatDate(s.date);
  if (month) {
    meta.appendChild(document.createTextNode(" · "));
    var t = el("time", "", month); t.setAttribute("datetime", s.date); meta.appendChild(t);
  }
  art.appendChild(meta);
  if (s.summary) art.appendChild(el("p", "sum", s.summary));
  if (s.take) {
    var take = el("p", "take");
    take.appendChild(el("strong", "", "My take: "));
    take.appendChild(document.createTextNode(s.take));
    art.appendChild(take);
  }
  return art;
}

// Draws a list with category filter buttons.
function section(listId, chipsId, items, block, emptyText, limit) {
  var listEl = document.getElementById(listId);
  var chipsEl = document.getElementById(chipsId);
  if (!listEl) return;
  var active = "All";

  function draw() {
    listEl.textContent = "";
    var shown = items.filter(function (x) { return active === "All" || x.category === active; });
    if (limit && active === "All") {
      var counts = {};
      shown = shown.filter(function (x) {
        counts[x.category] = (counts[x.category] || 0) + 1;
        return counts[x.category] <= limit;
      });
    }
    if (!shown.length) { listEl.appendChild(el("p", "empty", emptyText)); return; }
    shown.forEach(function (x) { listEl.appendChild(block(x)); });
  }
  function chips() {
    if (!chipsEl) return;
    chipsEl.textContent = "";
    var found = [];
    items.forEach(function (x) { if (found.indexOf(x.category) < 0) found.push(x.category); });
    found.sort(function (a, b) {
      var ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b);
      if (ia < 0) ia = 99;
      if (ib < 0) ib = 99;
      return ia - ib || (a < b ? -1 : a > b ? 1 : 0);
    });
    var cats = ["All"].concat(found);
    if (cats.length < 3) return; // no need for buttons with one category
    cats.forEach(function (c) {
      var b = el("button", "chip", c);
      b.type = "button";
      b.setAttribute("aria-pressed", c === active ? "true" : "false");
      b.addEventListener("click", function () { active = c; chips(); draw(); });
      chipsEl.appendChild(b);
    });
  }
  chips(); draw();
}

function showAll(items, loaded) {
  var mine = sortItems(items.filter(function (x) { return x.mine; }));
  var news = sortItems(items.filter(function (x) { return !x.mine; }));
  section("stories", "work-chips", mine, storyBlock, "No stories to show yet.");
  section("news-list", "news-chips", news, newsBlock,
    loaded ? "No headlines yet. They appear here after the first daily update."
           : "This section fills automatically once the daily update has run.", 4);
}

// ===== Loading =====
function fetchText(url) {
  var sep = url.indexOf("?") > -1 ? "&" : "?";
  return fetch(url + sep + "cb=" + Date.now()).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.text();
  });
}

function itemsFromFeed(feed) {
  if (!feed || !Array.isArray(feed.items)) return [];
  return feed.items.filter(function (i) { return i && i.headline; }).map(function (i) {
    return {
      headline: String(i.headline), link: safeUrl(i.link), outlet: String(i.outlet || ""),
      byline: "", date: String(i.date || ""), summary: String(i.summary || ""),
      topics: [], category: String(i.category || "News"), mine: false, take: ""
    };
  });
}

// Joins the lists. If two items share a link, they become one, and empty fields are filled
// from the other copy (so a sheet row can add "My take" to a BBC headline).
function mergeUnique(lists) {
  var byLink = {}, out = [];
  lists.forEach(function (list) {
    list.forEach(function (x) {
      if (x.link && byLink[x.link]) {
        var first = byLink[x.link];
        ["outlet", "summary", "date", "byline", "take"].forEach(function (k) {
          if (!first[k] && x[k]) first[k] = x[k];
        });
        if (first.category === "News" && x.category && x.category !== "News") first.category = x.category;
        if (!first.topics.length && x.topics.length) first.topics = x.topics;
        return;
      }
      if (x.link) byLink[x.link] = x;
      out.push(x);
    });
  });
  return out;
}

// ===== Tips and donations =====
function copyText(text, btn) {
  function done() {
    var old = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(function () { btn.textContent = old; }, 1500);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, function () {});
  } else {
    var t = document.createElement("textarea");
    t.value = text; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    document.body.removeChild(t);
  }
}

// rows: [label, value, canCopy]. Empty values are skipped.
function payCard(title, rows) {
  rows = rows.filter(function (r) { return r[1]; });
  if (!rows.length) return null;
  var card = el("div", "pay");
  card.appendChild(el("h3", "", title));
  var dl = el("dl");
  rows.forEach(function (r) {
    var row = el("div", "row");
    row.appendChild(el("dt", "", r[0]));
    var dd = el("dd");
    dd.appendChild(document.createTextNode(r[1]));
    if (r[2]) {
      var b = el("button", "copy", "Copy");
      b.type = "button";
      b.setAttribute("aria-label", "Copy " + r[0]);
      b.addEventListener("click", function () { copyText(r[1], b); });
      dd.appendChild(b);
    }
    row.appendChild(dd);
    dl.appendChild(row);
  });
  card.appendChild(dl);
  return card;
}

function renderDonate() {
  var box = document.getElementById("donate-options");
  var section = document.getElementById("support");
  var navLink = document.getElementById("nav-support");
  if (!box || !section) return;
  var cards = [];

  var pp = safeUrl(DONATE.paypal);
  if (pp) {
    var c1 = el("div", "pay");
    c1.appendChild(el("h3", "", "PayPal"));
    c1.appendChild(el("p", "", "Pay by card or PayPal balance, from anywhere."));
    var a = el("a", "btn", "Tip with PayPal");
    a.href = pp; a.target = "_blank"; a.rel = "noopener";
    c1.appendChild(a);
    cards.push(c1);
  }

  var m = DONATE.mpesa || {};
  var mp = payCard("M-Pesa", [
    ["Name", m.name, false],
    ["Send money to", m.phone, true],
    ["Till number", m.till, true],
    ["Paybill number", m.paybill, true],
    ["Account number", m.account, true]
  ]);
  if (mp) cards.push(mp);

  if (!cards.length) return;
  cards.forEach(function (c) { box.appendChild(c); });
  section.hidden = false;
  if (navLink) navLink.hidden = false;
}

// ===== Start =====
(function start() {
  var status = document.getElementById("status");
  var updated = document.getElementById("news-updated");
  renderDonate();
  showAll(BACKUP.slice(), false);
  if (typeof fetch !== "function") return;

  var sheetP = SHEET_URL
    ? fetchText(SHEET_URL).then(function (t) { return itemsFromRows(parseCSV(t)); }).catch(function () { return null; })
    : Promise.resolve([]);
  var feedP = fetchText(NEWS_URL).then(function (t) { return JSON.parse(t); }).catch(function () { return null; });

  Promise.all([sheetP, feedP]).then(function (r) {
    var sheetItems = r[0], feed = r[1];
    var all = mergeUnique([sheetItems || [], BACKUP, itemsFromFeed(feed)]);
    showAll(all, feed !== null);

    if (status && sheetItems === null) {
      status.textContent = "Couldn't load the Google Sheet, so only saved stories and daily headlines are shown.";
    }
    if (updated && feed && feed.updated) {
      var d = new Date(feed.updated);
      if (!isNaN(d.getTime())) {
        updated.textContent = "Headlines updated " + d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) + ".";
      }
    }
  });
})();
