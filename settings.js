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
    name: "",     // name that shows on M-Pesa, for example "Kelvin Kamau"
    phone: "",    // send-money number, for example "0712 345 678"
    till: "",     // Buy Goods till number
    paybill: "",  // Paybill business number
    account: ""   // account number to use with the Paybill
  }
};

// 4) Subscribe.
var SUBSCRIBE = {
  link: "",
  action: "https://assets.mailerlite.com/jsonp/2826079/forms/205184317072082831/subscribe",
  field: "fields[email]",
  extra: { "ml-submit": "1" }
};
