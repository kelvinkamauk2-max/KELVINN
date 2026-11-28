// ===== Your settings =====
// This is the only file that holds your personal details.
// When I give you a new script.js, you keep this file as it is.

// 1) Google Sheet with your own stories and "My take" notes.
//    Paste the published CSV link between the quotes (File > Share > Publish to web > Sheet1 + CSV).
//    Sheet columns (row 1 headings, any order):
//    headline | link | outlet | byline | date | summary | topics | category | mine | take
//    date: "YYYY-MM" or "YYYY-MM-DD", or leave empty.  mine: type yes if you wrote the story.
//    take: your own one or two sentences about a headline (shows as "My take").
var SHEET_URL = "";

// 2) Daily headlines file written by the GitHub Action. Leave this as it is.
var NEWS_URL = "https://raw.githubusercontent.com/kelvinkamauk2-max/KELVINN/main/news.json";

// 3) Donate. Fill in only what you use. Anything left empty ("") is hidden.
var DONATE = {
  // A PayPal link, for example "https://paypal.me/yourname"
  paypal: "",
  mpesa: {
    name: "kelvin kamau",
    phone: "0740018924",
    till: "",     
    paybill: "",
    account: ""
  }
};

// 4) Subscribe.
var SUBSCRIBE = {
  link: "",
  action: "https://assets.mailerlite.com/jsonp/2826079/forms/205184317072082831/subscribe",
  field: "fields[email]",
  extra: { "ml-submit": "1" }
};

// 6) Business details. All optional. Empty parts stay hidden on the site.
//    Do not invent prices or quotes. Only write what is true.
var CONTACT = { email: "kelvinkamauk2@gmail.com", whatsapp: "254740018924" };

// Services shown under "Services". Add a price when you are ready, for example "From KES 3,000".
// Leave "" to show "Request a quote". Common ways to price: per article, or a monthly package.
var SERVICES = [
  { title: "News and feature writing", text: "Carefully sourced news reports, features and profiles, written to your deadline and house style.", price: "" },
  { title: "Press releases and PR", text: "Press releases, statements and media pitches with clear headlines and the facts editors need.", price: "" },
  { title: "Social media management", text: "Planned posts, captions and community replies for hotels, restaurants and tourism brands.", price: "" },
  { title: "Content writing", text: "Website copy, blog posts and newsletters written in your brand's voice.", price: "" }
];

// Advertising. Keep options empty until you have readers to offer. When ready, replace [] with:
// [
//   { title: "Newsletter sponsor", text: "A short sponsor message in each newsletter issue, clearly labelled.", price: "" },
//   { title: "Sponsored post", text: "A clearly labelled sponsored item on this site.", price: "" }
// ]
var ADVERTISE = {
  intro: "Reach readers of my reporting and daily news picks.",
  options: []
};

// One labelled sponsor line. Leave empty until a sponsor has agreed and paid.
var SPONSOR = { name: "", message: "", link: "" };

var ABOUT = {
  bio: "I'm a freelance journalist based in Nairobi and accredited by the Media Council of Kenya. I report on county government, public health, security and tourism, and I follow football, technology, music and the arts. My reporting has been published by the Kenya News Agency. I also write press releases, social media posts and website content for Kenyan businesses.",
  pressCard: "Media Council of Kenya accredited",
  education: "Communications and Public Relations",
  languages: ""
};

// Real quotes only. When someone agrees, add a line like this inside the brackets:
// { quote: "Their exact words.", name: "Their name", role: "Their job, their organisation" }
var TESTIMONIALS = [];

// Paste the full web address of each profile you use. Empty ones stay hidden.
var SOCIAL = { x: "", linkedin: "", facebook: "", instagram: "", youtube: "", tiktok: "" };