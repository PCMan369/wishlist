/* =====================================================
   YOUR ITEMS. Copy one block to add an item. Any field you leave out is simply not shown.

   id          short name used in the item's link, e.g. id:"iphone" gives  ...#item-iphone
   name        what it is
   short       the big headline on the page (optional; otherwise the name up to the first comma)
   tagline     the one line under the headline, e.g. "256GB, Black, unlocked" (optional)
   badge       a small label such as "Black Friday price" (optional)
   images      list of photo URLs; the first is the cover. People can swipe through the rest.
   price       the price you'd pay (a string like "$52.99")
   priority    "critical" (Most wanted) | "high" (Would love) | "standard" (Nice to have) | "discretionary" (Optional)
   split       true lets several people chip in (shows a progress bar and amounts)
   stores      [{ name, price, link }, ...] one row per store; the lowest price is marked
   version     the few details that decide WHICH one to buy: [["Storage","256GB"], ["Color","Black"]]
   condition   whether used or refurbished is okay
   fill        true crops photos in to fill the frame (use when the product looks small in a wide photo)
   zoom        extra zoom with fill, e.g. 1.2 (optional)
   versionTitle  heading above the version rows, instead of "Make sure it's this version" (optional)
   joke        true makes it a gag item: "Try to claim it" just says no, nothing is saved
   jokeNote    the line shown in the details panel for a joke item (optional)
   priceLabel  text shown instead of a price, e.g. "Priceless" (optional)
   notes       a short extra line (e.g. a sale-price note)
   why         why you want it            whyThis    why this exact model
   substitutes what would be fine instead unacceptable what would not be
   link        main product page (used when there is no stores list)
   ===================================================== */
window.WISHLIST_ITEMS = [
  { id: "iphone", name: "iPhone 18 Pro, 256GB (Black, Unlocked)", short: "iPhone 18 Pro", tagline: "256GB, Black, unlocked",
    images: ["https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-18-pro-finish-select-202609-6-3inch-black?wid=1200&hei=630&fmt=jpeg&qlt=95&.v=1787003534949",
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-18-pro-finish-select-202609-6-3inch-black_AV2?wid=5120&hei=2880&fmt=webp&qlt=90&.v=ODB3TEdtbk8ybkd3clM3dWVML3VCYTBPcjFUQzN2eEEzbTlaeVZmVmk4UDFzS1BRRzA4NTJUci9vckVTY21rMzFpZXI3TzRVNFlCMkNIUFdtczRsaFE3b3pFWnhZZ2g0M0pRR0pEdHVSRUhOWndGa21oeDRMUFpMS1Q1YVdyV3ZVZ29LbmZmVHFFT3J2WVBRVVhBa0VR&traceId=1"],
    fill: true,
    price: "$1,199.00", priority: "critical",
    split: true,
    stores: [
      { name: "Apple", price: "$1,199.00", link: "https://www.apple.com/shop/buy-iphone/iphone-18-pro/6.3-inch-display-256gb-black-unlocked" },
      { name: "Amazon", price: "$1,439.00", link: "https://www.amazon.com/dp/B0HJHVB95Z" }
    ],
    version: [["Model", "iPhone 18 Pro (6.3-inch)"], ["Storage", "256GB"], ["Color", "Black"], ["Carrier", "Unlocked"]],
    why: "Essential for my business to grow. I would use it for communication with family, but it would also allow me to create my own Facebook Marketplace account so I can communicate with potential buyers directly, take better photos for faster sales, and more.",
    whyThis: "I chose this color because I like it the best, the Pro model because it has a better camera, which is important for selling computers, and Unlocked because it provides more freedom for the same price.",
    substitutes: "Any iPhone Pro model, starting with the iPhone 15 Pro, would work. Refurbished in good or better condition is fine.",
    unacceptable: "Non-Apple phones, broken iPhones, and Plus or Pro Max models.",
    notes: "", link: "https://www.apple.com/shop/buy-iphone/iphone-18-pro/6.3-inch-display-256gb-black-unlocked" },

  { id: "macbook", name: "MacBook Pro 14-inch (M6, Space Black)", short: "MacBook Pro 14-inch", tagline: "M6, 24GB, 1TB, Space Black",
    images: ["https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mac-macbook-pro-specs-select-202610-14inch-spaceblack?wid=1200&hei=630&fmt=jpeg&qlt=95&.v=1791280428475",
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mac-macbook-pro-finish-select-202610-14inch-spaceblack?wid=5120&hei=3280&fmt=webp&qlt=90&.v=aXlkdGF0T0RUUVdDckNLaUc0OEE0MEhGUTRkVVZndC9KWVVLOUdiOXdHbFRUUTNjeHpBQ2xlWU1qZ2FZVVlxYzRmRTZ3YnV6NGtLcENrcTFmd0VGckVvbDF6d2tlR0VmV2RIWCtmOCtid1czZXVXV1c0YmpUU3ozTnlwWXlrUjhac0N0R1I1WjVLaWpwaDBWekNtTmxn&traceId=1",
      "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mac-macbook-pro-finish-select-202610-14inch-spaceblack_AV3?wid=5120&hei=3280&fmt=webp&qlt=90&.v=aXlkdGF0T0RUUVdDckNLaUc0OEE0MEhGUTRkVVZndC9KWVVLOUdiOXdHbFRUUTNjeHpBQ2xlWU1qZ2FZVVlxY29xbGU4dEZRUmMxczltR3FlRDU1d1FPSHBTMDVNTCtFMWdCbVRyd3l2VzlOU1YvbEhQdCtlZmMrckc2K3RtQzRhUGRzYld3U091Q1VrT0lleDcvOXJR&traceId=1"],
    fill: true,
    price: "$2,199.00", priority: "high",
    split: true,
    stores: [
      { name: "Apple", price: "$2,199.00", link: "https://www.apple.com/shop/buy-mac/macbook-pro/14-inch-space-black-standard-display-apple-m6-chip-12-core-cpu-12-core-gpu-24gb-memory-1tb-storage" },
      { name: "Amazon", price: "$2,199.00", link: "https://a.co/d/00ozvkEw" }
    ],
    version: [["Size", "14-inch"], ["Chip", "Apple M6 (12-core CPU, 12-core GPU)"], ["Memory", "24GB"], ["Storage", "1TB"], ["Color", "Space Black"]],
    why: "Mine is old, slow, and loud, and has poor battery life. It is at least 7 years old and feels that way too. I would use a new one for personal use, school, possibly games, and business stuff. It is true that I can do all of those things now, but not without some difficulty.",
    whyThis: "I chose this color because I like it the best, 24GB RAM because it is only +$200 over 16GB (which is great in this economy), and 14-inch because I prefer the portability of smaller laptops.",
    substitutes: "Any 13- or 14-inch MacBook Pro with an M1 or newer, in good or better condition.",
    unacceptable: "Any MacBook with an Intel chip, with less than 16GB of RAM, or with significant damage. Also any non-Apple laptop.",
    notes: "", link: "https://www.apple.com/shop/buy-mac/macbook-pro/14-inch-space-black-standard-display-apple-m6-chip-12-core-cpu-12-core-gpu-24gb-memory-1tb-storage" },

  { id: "screwdriver", name: "Fanttik E2 Ultra Electric Screwdriver (Grey)", short: "Fanttik E2 Ultra", tagline: "Electric screwdriver",
    images: ["https://m.media-amazon.com/images/I/71aImxzOWZL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71qKzpWP1pL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71m7BLLFryL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71f0SJzjJkL._AC_SL1500_.jpg"],
    price: "$52.99", priority: "standard",
    stores: [{ name: "Amazon", price: "$52.99", link: "https://www.amazon.com/dp/B0DSVKLNQR" }],
    version: [["Model", "E2 Ultra"], ["Color", "Grey"]],
    why: "Increases efficiency and speed of PC builds, thereby increasing my profit per hour.",
    whyThis: "I chose this model because it is a known-reliable unit, has plenty of bits, and has a good battery life.",
    substitutes: "Any reliable electric screwdriver with a variety of bits and adjustable torque, with a maximum of about 0.67 N·m or lower.",
    unacceptable: "Any model that is wired, is slow, does not have adjustable torque, or does not come with various bits, especially Phillips heads.",
    notes: "", link: "https://www.amazon.com/dp/B0DSVKLNQR" },

  { id: "air-duster", name: "Fanttik B10 Pro Max Electric Air Duster with Powerbank (Grey)", short: "Fanttik B10 Pro Max", tagline: "Electric air duster", badge: "Black Friday price",
    images: ["https://m.media-amazon.com/images/I/61DtOwQAXlL._AC_SX466_.jpg",
      "https://m.media-amazon.com/images/I/71A34F7mRPL._AC_SL1500_.jpg",
      "https://m.media-amazon.com/images/I/61Sd2GmLbFL._AC_SL1500_.jpg"],
    price: "$49.99", priority: "standard",
    stores: [{ name: "Amazon", price: "$49.99", link: "https://a.co/d/042eOTYC" }],
    version: [["Model", "B10 Pro Max"], ["Color", "Grey"]],
    why: "Easier and ultimately cheaper than canned air for cleaning PC parts.",
    whyThis: "I chose this model because it is a known-reliable unit, with multiple attachments and accessories useful for my purposes.",
    substitutes: "Any reliable battery-powered air duster, preferably with similar accessories.",
    unacceptable: "Any wired, weak, or used model.",
    notes: "Black Friday price. Regular price is $79.99.", link: "https://a.co/d/042eOTYC" },

  { id: "tech-way", name: "325 Tech Way Industrial Park, Grants Pass, OR (Units C and D)", short: "325 Tech Way", tagline: "Industrial space for lease, Grants Pass, OR", badge: "Aspirational",
    images: ["https://images1.loopnet.com/i2/IPj7i_A4xNAkFVOrPt9iAL3CDDHUsDThuwJ_LZaVUz4/112/image.jpg",
      "https://images1.loopnet.com/i2/0lIKkk5rIjQBiAMf8mslMxBrhO22p-uUuEzx6NpkO5w/117/image.jpg"],
    priority: "discretionary", joke: true, versionTitle: "Available spaces", priceLabel: "$9.60 /SF/yr",
    stores: [],
    version: [["Unit C", "5,000 SF, about $4,000/month"], ["Unit D", "4,000 SF, about $3,200/month"], ["Use", "Industrial, full build-out"], ["Term", "Negotiable"], ["Available", "Jan 1, 2027"]],
    why: "I don't actually want this, although extra space would be nice, as my room feels pretty small.",
    whyThis: "Again, I don't actually want this, but I picked it because it is in town and on \"Tech Way,\" which adds to the humor.",
    unacceptable: "Actually getting me this.",
    notes: "Not actually desired. Purely aspirational.", link: "https://www.loopnet.com/Listing/325-Tech-Way-Grants-Pass-OR/43295894/" }
];
