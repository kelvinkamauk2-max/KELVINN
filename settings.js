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

//    Services shown under "Services". Add a price such as "From KES 5,000" or leave "" to show "Request a quote".
var SERVICES = [
  { title: "News and feature writing", text: "Accurate, readable reporting and longer features on county affairs, health, business and public life.", price: "" },
  { title: "Press releases and PR", text: "Clear press releases, media pitches and statements that journalists actually read.", price: "" },
  { title: "Social media management", text: "Regular posts, captions and community replies for hotels, restaurants and tourism brands.", price: "" },
  { title: "Content writing", text: "Website copy, blog posts and newsletters in your brand's voice.", price: "" }
];

//    Advertising and sponsorship. Add options to show the section, for example:
//    { title: "Newsletter sponsor", text: "One sponsor message in each newsletter.", price: "KES ..." }
var ADVERTISE = { intro: "", options: [] };

//    One clearly labelled sponsor line above the headlines. Needs both a message and an https link.
var SPONSOR = { name: "", message: "", link: "" };

//    About me. The section shows only when bio is filled in.
var ABOUT = { bio: "", pressCard: "", education: "", languages: "" };

//    Real client or editor quotes only, for example { quote: "...", name: "Name", role: "Role, Company" }
var TESTIMONIALS = [];

//    Full web addresses of your profiles. Empty ones are hidden.
var SOCIAL = { x: "", linkedin: "", facebook: "", instagram: "", youtube: "", tiktok: "" };
