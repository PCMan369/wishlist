/* =====================================================
   SETTINGS: the only file you edit to change how the site behaves.
   (Items live in items.js.) Edit right on github.com: open the file,
   click the pencil, change, then "Commit changes". The site updates in about a minute.
   ===================================================== */
window.WISHLIST_CONFIG = {
  name: "Jacob",
  birthday: { year: 2026, month: 12, day: 30 },
  lastUpdated: "2026-11-19",   // YYYY-MM-DD. Shown in the footer. Change it when you edit the list.

  // The thin bar under the top menu, and the closing note at the bottom of the page.
  stripText: "A gift is not required. Anything from the list is appreciated.",
  noteTitle: "A gift is not required.",
  note: "Thank you for taking the time to look at this list. Anything from the list is appreciated, and anything not on the list is also appreciated.",

  // Shown as a small "Good to know" row. Leave a line as "" and it is hidden.
  delivery: {
    ship: "",   // e.g. "Ask me for the address"
    by:   "",   // e.g. "Before December 30"
    wrap: ""    // e.g. "Gift wrap is optional"
  },

  // Optional extra boxes at the bottom, e.g. { title: "Sizes", text: "Shirts: L · Shoes: 10" }
  about: [],

  // FAMILY PASSWORD: open tools/set-password.html, type a password, paste the line it gives you here.
  // Leave "" to turn the password screen off (fine while you're still building).
  passwordHash: "cc9ce5859e001a57edbb43ba3171cae0095cc6a2c5a38a09687c90b368c9f6ca",

  // YOUR PRIVATE VIEW: open the site once with  ?as=<this key>  on each of your own devices
  // and claims stay hidden from you on that device. Change this key to anything you like.
  recipientKey: "jacob-view",

  // FIREBASE (stores who is buying what). Paste the four values from SETUP.md step 2.
  // While apiKey is "", the site runs in preview mode and claims only save on your own device.
  firebase: {
    apiKey: "AIzaSyDv1bUX0NG2422t6W3FrAPfC__f3q_7w_0",
    authDomain: "jacob-wishlist.firebaseapp.com",
    projectId: "jacob-wishlist",
    appId: "1:562842519666:web:429bfa38ca322e55a25aeb"
  }
};
