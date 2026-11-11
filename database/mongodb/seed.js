// =============================================================================
//  Vela Noire: MongoDB sample data (the "menu album")
// =============================================================================
//  Real Vela Noire catalogue taken from docs/brandDetails.md: 7 categories,
//  7 collections (with the 4 seasonal lines), 21 products, a few reviews and
//  clickstream events for the two demo customers in MySQL.
//
//  Run AFTER init.js:   mongosh --file database/mongodb/seed.js
//  ⚠ Clears and refills every collection.
//
//  Product _ids are FIXED, so MySQL rows (order_items, cart_items, wishlist_items)
//  can point at them and still match after a reset. Pattern: 6750a10000000000000 + code.
//  userId values are MySQL users.id (2 = Amira, 3 = Layla).
// =============================================================================

const dbName = process.env.MONGODB_DATABASE || "vela_noire";
const target = db.getSiblingDB(dbName);

const id = (code) => ObjectId(`6750a1000000000000000${code}`); // code = 3 digits
const usd = (n) => NumberDecimal(n.toFixed(2));
const int = (n) => NumberInt(n);
const img = (file) => `/assets/images/${file}`;
const now = new Date();

const ABAYA_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "Custom"];
const ABAYA_LENGTHS = ["52", "54", "56", "58", "60"];

/** variant helper: sku, colour name, hex, stock, image, default? */
const v = (sku, colorName, colorHex, stock, image, isDefault = false) => ({
  sku, colorName, colorHex, stock: int(stock), priceOverride: null, images: image ? [img(image)] : [], isDefault,
});

/** shared product defaults */
const product = (code, fields) => ({
  _id: id(code),
  designer: "Vela Noire Atelier",
  discountPercent: int(0),
  status: "LIVE",
  isNew: false,
  isBestSeller: false,
  isLimitedEdition: false,
  launchDate: null,
  releaseDate: null,
  season: null,
  seasonalLine: null,
  tags: [],
  ratings: { average: 0, count: int(0) },
  createdAt: now,
  updatedAt: now,
  ...fields,
});

const abaya = (fabric, styles, shaylaIncluded = true) => ({
  fabric, styles, sizes: ABAYA_SIZES, lengths: ABAYA_LENGTHS, shaylaIncluded,
});
const perfume = (top, heart, base, volumeMl = 50) => ({ volumeMl: int(volumeMl), notes: { top, heart, base } });

// -----------------------------------------------------------------------------
// Categories
// -----------------------------------------------------------------------------
const categories = [
  { slug: "abaya", name: "Abayas", description: "Timeless abayas for the bold, graceful Muslimah.", image: img("abaya.webp") },
  { slug: "perfume", name: "Perfumes", description: "Oud, musk and florals, each scent tied to a collection.", image: img("fragrance.webp") },
  { slug: "handbag", name: "Handbags", description: "Clutches, totes and box bags with gold hardware.", image: img("accessories.webp") },
  { slug: "bracelet", name: "Bracelets", description: "From dainty chains to statement cuffs.", image: img("accessories.webp") },
  { slug: "shayla", name: "Shayla", description: "Soft chiffon and crepe shaylas to complete the look.", image: img("shayla.webp") },
  { slug: "shoes", name: "Shoes", description: "Elegant footwear to pair with every abaya.", image: null },
  { slug: "accessory", name: "Accessories", description: "Watches and finishing touches.", image: img("accessories.webp") },
].map((c, i) => ({ ...c, displayOrder: int(i + 1) }));

// -----------------------------------------------------------------------------
// Collections
// -----------------------------------------------------------------------------
const collections = [
  {
    slug: "rare-collectibles", name: "Rare Collectibles",
    tagline: "Dropped once a year. Never restocked.",
    description: "Exclusive limited-edition sets: one abaya, one perfume and one accessory, sold together only. 30 to 50 sets per year.",
    audience: "Collectors who want something no one else has",
    palette: ["Gold", "Black", "Blush"], heroImage: img("A1.webp"),
  },
  {
    slug: "infinity-bride", name: "Infinity Bride",
    tagline: "Fresh, clean, soft, pure.",
    description: "Bridal abayas in white, cream and pearl beige with gold or silver thread, for newlyweds and brides-to-be.",
    audience: "Newlyweds or brides-to-be",
    palette: ["Pearl", "Gold", "White", "Soft Beige"], heroImage: img("A4.webp"),
  },
  {
    slug: "modern-muse", name: "Modern Muse",
    tagline: "Tailored for the woman on the move.",
    description: "Tailored cuts, belt options, muted colours and lightweight fabrics.",
    audience: "Urban, professional and trendy Muslim women",
    palette: ["Taupe", "Black", "Soft Grey", "Dusty Rose"], heroImage: img("A2.webp"),
  },
  {
    slug: "lux-infinity", name: "Lux Infinity",
    tagline: "For the moments you want to feel special.",
    description: "Velvet, heavy silk, unique cuts and dramatic sleeves in jewel tones with gold stitching.",
    audience: "Premium shoppers",
    palette: ["Royal Blue", "Gold", "Emerald", "Maroon"], heroImage: img("A1.webp"),
  },
  {
    slug: "traditions-reimagined", name: "Traditions Reimagined",
    tagline: "Heritage, with modern stitching.",
    description: "Traditional Saudi and Emirati cuts with subtle Islamic geometric embroidery.",
    audience: "Women who love heritage and modesty",
    palette: ["Black", "Navy", "Deep Brown", "Terracotta"], heroImage: img("A3.webp"),
  },
  {
    slug: "simplicity-speaks", name: "Simplicity Speaks",
    tagline: "Clean lines. Quiet confidence.",
    description: "Straight-cut abayas with minimal lines, no embroidery and neutral tones in breathable cotton-linen.",
    audience: "Minimalist women who love clean cuts and comfort",
    palette: ["Sand", "Ivory", "Charcoal", "Soft Sage"], heroImage: img("A4.webp"),
  },
  {
    slug: "seasonal", name: "Seasonal",
    tagline: "A new story every season.",
    description: "Each season brings a 2-piece abaya, a signature perfume, a purse and a bracelet.",
    audience: "Everyone",
    palette: [], heroImage: img("abaya.webp"),
    lines: [
      { name: "Desert Bloom", season: "SUMMER", theme: "Light, breathable, elegant", palette: ["Sand beige", "White", "Aqua", "Gold"] },
      { name: "Velvet Moon", season: "WINTER", theme: "Cozy, deep elegance", palette: ["Black", "Midnight blue", "Emerald", "Silver"] },
      { name: "Amber Luxe", season: "AUTUMN", theme: "Warm, rich, golden", palette: ["Burgundy", "Caramel", "Olive green"] },
      { name: "Floral Grace", season: "SPRING", theme: "Soft, floral, feminine", palette: ["Lavender", "Peach", "Rose pink", "Mint green"] },
    ],
  },
].map((c) => ({ heroVideo: null, ...c }));

// -----------------------------------------------------------------------------
// Products
// -----------------------------------------------------------------------------
const products = [
  // ── Seasonal · Winter · Velvet Moon (the full set) ──────────────────────────
  product("101", {
    name: "Velvet Moon Abaya", slug: "velvet-moon-abaya", category: "abaya",
    collection: "seasonal", season: "WINTER", seasonalLine: "Velvet Moon",
    description: "A 2-piece velvet abaya in deep winter tones, cut full-length for warmth and grace.",
    story: "Inspired by quiet winter nights when the moon sits low over the desert.",
    basePrice: usd(145), isNew: true, isBestSeller: true,
    tags: ["winter", "velvet", "two-piece", "evening"],
    images: [img("A1.webp")],
    abaya: abaya("Velvet", ["OPEN_FRONT", "CLOSED_FRONT"]),
    variants: [
      v("VN-ABY-VM-01-PLM", "Midnight Plum", "#3b1f3a", 14, "A1.webp", true),
      v("VN-ABY-VM-01-NVY", "Midnight Navy", "#1b2440", 10, "A1.webp"),
      v("VN-ABY-VM-01-BLK", "Noir", "#0d0d0d", 18, "A1.webp"),
    ],
  }),
  product("102", {
    name: "Ruqayyah Eau de Parfum", slug: "ruqayyah-eau-de-parfum", category: "perfume",
    collection: "seasonal", season: "WINTER", seasonalLine: "Velvet Moon",
    description: "Oud and musk with hints of incense. The scent of the Velvet Moon season.",
    basePrice: usd(55), isBestSeller: true,
    tags: ["winter", "oud", "musk", "incense"],
    images: [img("fragrance.webp")],
    perfume: perfume(["Incense"], ["Oud"], ["Musk", "Amber"]),
    variants: [v("VN-PRF-VM-02-50", "50 ml", "#2a1b12", 40, "fragrance.webp", true)],
  }),
  product("103", {
    name: "Velvet Moon Mini Bag", slug: "velvet-moon-mini-bag", category: "handbag",
    collection: "seasonal", season: "WINTER", seasonalLine: "Velvet Moon",
    description: "A faux leather mini-bag with a gold chain strap.",
    basePrice: usd(70),
    tags: ["winter", "mini-bag", "gold-chain"],
    images: [img("accessories.webp")],
    variants: [v("VN-BAG-VM-03-BLK", "Black", "#111111", 12, "accessories.webp", true)],
  }),
  product("104", {
    name: "Onyx Night Bracelet", slug: "onyx-night-bracelet", category: "bracelet",
    collection: "seasonal", season: "WINTER", seasonalLine: "Velvet Moon",
    description: "A black gemstone bracelet with an onyx look.",
    basePrice: usd(35),
    tags: ["winter", "onyx", "gemstone"],
    images: [img("accessories.webp")],
    variants: [v("VN-BRC-VM-04-ONX", "Onyx", "#16161a", 25, "accessories.webp", true)],
  }),

  // ── Seasonal · Summer · Desert Bloom ────────────────────────────────────────
  product("201", {
    name: "Desert Bloom Two-Piece Abaya", slug: "desert-bloom-two-piece-abaya", category: "abaya",
    collection: "seasonal", season: "SUMMER", seasonalLine: "Desert Bloom",
    description: "An open-style abaya in a breathable linen blend, in earthy tones and off-whites.",
    basePrice: usd(120),
    tags: ["summer", "linen", "two-piece", "lightweight"],
    images: [img("A2.webp")],
    abaya: abaya("Linen blend", ["OPEN_FRONT"]),
    variants: [
      v("VN-ABY-DB-01-SND", "Sand Beige", "#d8c3a5", 16, "A2.webp", true),
      v("VN-ABY-DB-01-IVR", "Ivory", "#f4efe6", 12, "A2.webp"),
    ],
  }),
  product("202", {
    name: "Noor Al-Sabah Eau de Parfum", slug: "noor-al-sabah-eau-de-parfum", category: "perfume",
    collection: "seasonal", season: "SUMMER", seasonalLine: "Desert Bloom",
    description: "Citrus and vanilla with a light touch of oud. Morning light, bottled.",
    basePrice: usd(50),
    tags: ["summer", "citrus", "vanilla", "light-oud"],
    images: [img("fragrance.webp")],
    perfume: perfume(["Citrus"], ["Vanilla"], ["Light Oud"]),
    variants: [v("VN-PRF-DB-02-50", "50 ml", "#e9c46a", 35, "fragrance.webp", true)],
  }),

  // ── Seasonal · Autumn · Amber Luxe ──────────────────────────────────────────
  product("211", {
    name: "Amber Luxe Abaya", slug: "amber-luxe-abaya", category: "abaya",
    collection: "seasonal", season: "AUTUMN", seasonalLine: "Amber Luxe",
    description: "A 2-piece abaya in deep olive and amber with gold detail, in a luxurious matte fabric.",
    basePrice: usd(130),
    tags: ["autumn", "gold-detail", "two-piece", "matte"],
    images: [img("abaya.webp")],
    abaya: abaya("Matte crepe", ["OPEN_FRONT", "HALF_CLOSED"]),
    variants: [
      v("VN-ABY-AL-01-OLV", "Deep Olive", "#2f3b2a", 11, "abaya.webp", true),
      v("VN-ABY-AL-01-AMB", "Amber", "#a8622a", 9, "abaya.webp"),
    ],
  }),

  // ── Seasonal · Spring · Floral Grace ────────────────────────────────────────
  product("221", {
    name: "Floral Grace Abaya", slug: "floral-grace-abaya", category: "abaya",
    collection: "seasonal", season: "SPRING", seasonalLine: "Floral Grace",
    description: "A flowing chiffon abaya in soft pastels: new beginnings, femininity, hope.",
    basePrice: usd(125), isNew: true,
    tags: ["spring", "chiffon", "pastel", "floral"],
    images: [img("A3.webp")],
    abaya: abaya("Chiffon", ["OPEN_FRONT", "COMPLETELY_CLOSED"]),
    variants: [
      v("VN-ABY-FG-01-MNT", "Mint", "#bfe3d0", 10, "A3.webp", true),
      v("VN-ABY-FG-01-BLS", "Blush", "#f2c6c2", 10, "A3.webp"),
    ],
  }),

  // ── Infinity Bride ──────────────────────────────────────────────────────────
  product("301", {
    name: "Pearl Bride Abaya", slug: "pearl-bride-abaya", category: "abaya",
    collection: "infinity-bride",
    description: "Embellished white abaya with subtle lace and pearl trim, in flowing satin with gold thread embroidery.",
    basePrice: usd(220), isBestSeller: true,
    tags: ["bridal", "pearl", "lace", "satin", "wedding"],
    images: [img("A4.webp")],
    abaya: abaya("Satin", ["OPEN_FRONT", "CLOSED_FRONT"]),
    variants: [
      v("VN-ABY-IB-01-PRL", "Pearl White", "#f8f6f0", 6, "A4.webp", true),
      v("VN-ABY-IB-01-IVR", "Ivory Cream", "#efe6d2", 6, "A4.webp"),
    ],
  }),
  product("302", {
    name: "Farhat Zifaf Eau de Parfum", slug: "farhat-zifaf-eau-de-parfum", category: "perfume",
    collection: "infinity-bride",
    description: "Fresh floral with creamy musk, in a glass bottle with a gold top and white ribbon.",
    basePrice: usd(65),
    tags: ["bridal", "floral", "musk", "jasmine"],
    images: [img("fragrance.webp")],
    perfume: perfume(["Jasmine"], ["White Florals"], ["Creamy Musk"]),
    variants: [v("VN-PRF-IB-02-50", "50 ml", "#f5efe1", 20, "fragrance.webp", true)],
  }),

  // ── Modern Muse ─────────────────────────────────────────────────────────────
  product("401", {
    name: "Muse Belted Abaya", slug: "muse-belted-abaya", category: "abaya",
    collection: "modern-muse",
    description: "A tailored abaya with structured shoulders and an optional belt, in lightweight matte crepe.",
    basePrice: usd(110),
    tags: ["tailored", "belted", "workwear", "crepe"],
    images: [img("A2.webp")],
    abaya: abaya("Matte crepe", ["OPEN_FRONT", "CLOSED_FRONT"], false),
    variants: [
      v("VN-ABY-MM-01-KHK", "Khaki", "#a89f80", 12, "A2.webp", true),
      v("VN-ABY-MM-01-RSE", "Dusty Rose", "#c9a19c", 10, "A2.webp"),
      v("VN-ABY-MM-01-GRY", "Soft Grey", "#9a9a9a", 10, "A2.webp"),
    ],
  }),

  // ── Lux Infinity ────────────────────────────────────────────────────────────
  product("501", {
    name: "Malikat Al-Layl Abaya", slug: "malikat-al-layl-abaya", category: "abaya",
    collection: "lux-infinity",
    description: "Velvet and silk mix in jewel tones with gold stitching and dramatic sleeves.",
    basePrice: usd(240), isLimitedEdition: true,
    tags: ["luxury", "velvet", "silk", "gold-stitching", "evening"],
    images: [img("A1.webp")],
    abaya: abaya("Velvet and silk", ["OPEN_FRONT"]),
    variants: [
      v("VN-ABY-LX-01-WIN", "Wine", "#5a1a2b", 5, "A1.webp", true),
      v("VN-ABY-LX-01-NVY", "Royal Navy", "#1d2a5c", 5, "A1.webp"),
      v("VN-ABY-LX-01-EMR", "Emerald", "#0f4d3c", 4, "A1.webp"),
    ],
  }),
  product("502", {
    name: "Malikat Al-Layl Eau de Parfum", slug: "malikat-al-layl-eau-de-parfum", category: "perfume",
    collection: "lux-infinity",
    description: "Oud, amber and saffron in a black bottle with gold edges and a heavy cap.",
    basePrice: usd(85),
    tags: ["luxury", "oud", "amber", "saffron"],
    images: [img("fragrance.webp")],
    perfume: perfume(["Saffron"], ["Exotic Florals"], ["Oud", "Amber"]),
    variants: [v("VN-PRF-LX-02-50", "50 ml", "#1a1a1a", 15, "fragrance.webp", true)],
  }),

  // ── Traditions Reimagined ───────────────────────────────────────────────────
  product("601", {
    name: "Heritage Wide-Sleeve Abaya", slug: "heritage-wide-sleeve-abaya", category: "abaya",
    collection: "traditions-reimagined",
    description: "Full-length classic cut with wide sleeves and traditional Islamic geometric embroidery.",
    basePrice: usd(135),
    tags: ["heritage", "embroidered", "geometric", "classic"],
    images: [img("A3.webp")],
    abaya: abaya("Crepe and cotton mix", ["OPEN_FRONT", "COMPLETELY_CLOSED"]),
    variants: [
      v("VN-ABY-TR-01-BLK", "Black", "#0d0d0d", 14, "A3.webp", true),
      v("VN-ABY-TR-01-BRN", "Deep Brown", "#3e2a1e", 8, "A3.webp"),
    ],
  }),
  product("602", {
    name: "Zahrah Eau de Parfum", slug: "zahrah-eau-de-parfum", category: "perfume",
    collection: "traditions-reimagined",
    description: "Oud, rose and frankincense in an earthy bottle with Arabic calligraphy.",
    basePrice: usd(55),
    tags: ["heritage", "oud", "rose", "frankincense"],
    images: [img("fragrance.webp")],
    perfume: perfume(["Spices"], ["Rose"], ["Oud", "Frankincense", "Sandalwood"]),
    variants: [v("VN-PRF-TR-02-50", "50 ml", "#7a4a2a", 25, "fragrance.webp", true)],
  }),

  // ── Simplicity Speaks ───────────────────────────────────────────────────────
  product("701", {
    name: "Sukun Straight-Cut Abaya", slug: "sukun-straight-cut-abaya", category: "abaya",
    collection: "simplicity-speaks",
    description: "Straight-cut, no embroidery, clean silhouette in a breathable cotton-linen blend. Side slits and pockets.",
    basePrice: usd(65), isBestSeller: true,
    tags: ["minimal", "everyday", "cotton-linen", "pockets"],
    images: [img("A4.webp")],
    abaya: abaya("Cotton-linen blend", ["OPEN_FRONT", "CLOSED_FRONT"], false),
    variants: [
      v("VN-ABY-SS-01-SND", "Sand", "#d6c4a8", 20, "A4.webp", true),
      v("VN-ABY-SS-01-IVR", "Ivory", "#f3eee3", 20, "A4.webp"),
      v("VN-ABY-SS-01-CHR", "Charcoal", "#36383b", 20, "A4.webp"),
      v("VN-ABY-SS-01-SGE", "Soft Sage", "#a9b8a0", 15, "A4.webp"),
    ],
  }),
  product("702", {
    name: "Sukun Eau de Parfum", slug: "sukun-eau-de-parfum", category: "perfume",
    collection: "simplicity-speaks",
    description: "Soft musk, powdery sandalwood and clean cotton, in a matte frosted bottle.",
    basePrice: usd(40),
    tags: ["minimal", "musk", "sandalwood", "clean"],
    images: [img("fragrance.webp")],
    perfume: perfume(["Clean Cotton"], ["Powdery Sandalwood"], ["Soft Musk"]),
    variants: [v("VN-PRF-SS-02-50", "50 ml", "#ece8e1", 40, "fragrance.webp", true)],
  }),
  product("703", {
    name: "Slim Silver Chain Bracelet", slug: "slim-silver-chain-bracelet", category: "bracelet",
    collection: "simplicity-speaks",
    description: "A slim silver chain with a delicate clasp. Elegant, single-line, no charms.",
    basePrice: usd(25),
    tags: ["minimal", "silver", "chain"],
    images: [img("accessories.webp")],
    variants: [v("VN-BRC-SS-03-SLV", "Silver", "#c0c0c0", 30, "accessories.webp", true)],
  }),
  product("704", {
    name: "Sukun Matte Tote", slug: "sukun-matte-tote", category: "handbag",
    collection: "simplicity-speaks",
    description: "A matte faux leather tote with soft lines. Minimalist, monochrome, no logos.",
    basePrice: usd(45),
    tags: ["minimal", "tote", "everyday"],
    images: [img("accessories.webp")],
    variants: [v("VN-BAG-SIM-01-TAU", "Taupe", "#8b7d6b", 18, "accessories.webp", true)],
  }),

  // ── Shayla (worn with any collection) ───────────────────────────────────────
  product("705", {
    name: "Classic Chiffon Shayla", slug: "classic-chiffon-shayla", category: "shayla",
    collection: null,
    description: "A soft, lightweight chiffon shayla that drapes beautifully with every abaya.",
    basePrice: usd(20),
    tags: ["chiffon", "everyday", "essential"],
    images: [img("shayla.webp")],
    variants: [
      v("VN-SHY-01-BLK", "Black", "#0d0d0d", 50, "shayla.webp", true),
      v("VN-SHY-01-SND", "Sand", "#d6c4a8", 40, "shayla.webp"),
    ],
  }),

  // ── Rare Collectibles (sold as a set only) ──────────────────────────────────
  product("801", {
    name: "Midnight Ayah Collectible Set", slug: "midnight-ayah-collectible-set", category: "abaya",
    collection: "rare-collectibles",
    description: "Noor in the Dark Set. Mystical and modern, spiritual luxury. Never restocked once sold out.",
    story: "Deep black velvet with Quranic calligraphy lining inside the sleeves, packed in a matte black box with silver foil verses from Surah Al-Fajr.",
    basePrice: usd(310), isLimitedEdition: true, isNew: true,
    tags: ["rare", "limited-edition", "set", "velvet", "calligraphy"],
    images: [img("abaya.webp")],
    abaya: abaya("Velvet", ["OPEN_FRONT"]),
    setItems: [
      { category: "abaya", description: "Deep black velvet abaya with Quranic calligraphy lining inside the sleeves" },
      { category: "perfume", description: "Night jasmine, vanilla and musk blend" },
      { category: "bracelet", description: "Onyx crystal bracelet with Arabic engraving" },
    ],
    variants: [v("VN-SET-RC-01-BLK", "Noir", "#000000", 40, "abaya.webp", true)],
  }),
];

// -----------------------------------------------------------------------------
// Reviews (userId = MySQL users.id: 2 Amira, 3 Layla)
// -----------------------------------------------------------------------------
const day = (iso) => new Date(iso);
const reviews = [
  { productId: id("101"), userId: int(2), userName: "Amira H.", rating: int(5), title: "Like wearing the night sky",
    comment: "The velvet is heavy and soft, and the plum colour is even richer in person.", verifiedPurchase: true, createdAt: day("2026-10-12T19:00:00Z") },
  { productId: id("102"), userId: int(2), userName: "Amira H.", rating: int(5), title: "My new signature scent",
    comment: "Warm oud that lasts all day without being too strong.", verifiedPurchase: true, createdAt: day("2026-10-12T19:05:00Z") },
  { productId: id("101"), userId: int(3), userName: "Layla M.", rating: int(4), title: "Beautiful, runs slightly long",
    comment: "Gorgeous fabric. I would pick one length shorter next time.", verifiedPurchase: false, createdAt: day("2026-08-14T10:00:00Z") },
  { productId: id("701"), userId: int(3), userName: "Layla M.", rating: int(4), title: "Perfect everyday abaya",
    comment: "Light, breathable and the pockets are a lifesaver.", verifiedPurchase: false, createdAt: day("2026-07-20T09:30:00Z") },
  { productId: id("103"), userId: int(3), userName: "Layla M.", rating: int(5), title: "Small but holds everything",
    comment: "The gold chain looks so elegant.", verifiedPurchase: false, createdAt: day("2026-08-15T13:00:00Z") },
];

// -----------------------------------------------------------------------------
// Clickstream: Amira's shopping session that ended in order #1, and Layla browsing
// -----------------------------------------------------------------------------
const ev = (userId, sessionId, type, device, iso, extra = {}) => ({
  userId: int(userId), sessionId, type, device, timestamp: day(iso),
  productId: null, category: null, query: null, orderId: null, page: "/", ...extra,
});
const clickstream = [
  ev(2, "sess-amira-20261002", "SEARCH", "MOBILE", "2026-10-02T19:58:00Z", { query: "velvet abaya", page: "/search" }),
  ev(2, "sess-amira-20261002", "VIEW", "MOBILE", "2026-10-02T19:59:10Z", { productId: id("101"), category: "abaya", page: "/products/velvet-moon-abaya" }),
  ev(2, "sess-amira-20261002", "ADD_TO_CART", "MOBILE", "2026-10-02T20:03:40Z", { productId: id("101"), category: "abaya", page: "/products/velvet-moon-abaya" }),
  ev(2, "sess-amira-20261002", "VIEW", "MOBILE", "2026-10-02T20:05:00Z", { productId: id("102"), category: "perfume", page: "/products/ruqayyah-eau-de-parfum" }),
  ev(2, "sess-amira-20261002", "ADD_TO_CART", "MOBILE", "2026-10-02T20:06:20Z", { productId: id("102"), category: "perfume", page: "/products/ruqayyah-eau-de-parfum" }),
  ev(2, "sess-amira-20261002", "PURCHASE", "MOBILE", "2026-10-02T20:14:00Z", { orderId: int(1), page: "/checkout" }),
  ev(3, "sess-layla-20260815", "SEARCH", "MOBILE", "2026-08-15T12:50:00Z", { query: "tote bag", page: "/search" }),
  ev(3, "sess-layla-20260815", "VIEW", "MOBILE", "2026-08-15T12:51:00Z", { productId: id("704"), category: "handbag", page: "/products/sukun-matte-tote" }),
  ev(3, "sess-layla-20260815", "ADD_TO_CART", "MOBILE", "2026-08-15T12:53:30Z", { productId: id("704"), category: "handbag", page: "/products/sukun-matte-tote" }),
  ev(3, "sess-layla-20260815", "VIEW", "MOBILE", "2026-08-15T12:57:00Z", { productId: id("103"), category: "handbag", page: "/products/velvet-moon-mini-bag" }),
  ev(3, "sess-layla-20260815", "WISHLIST", "MOBILE", "2026-08-15T12:58:10Z", { productId: id("103"), category: "handbag", page: "/products/velvet-moon-mini-bag" }),
];

// -----------------------------------------------------------------------------
// Write everything
// -----------------------------------------------------------------------------
print(`\nSeeding MongoDB database "${dbName}"\n`);
for (const [name, docs] of [
  ["categories", categories],
  ["collections", collections],
  ["products", products],
  ["reviews", reviews],
  ["clickstream_events", clickstream],
]) {
  target.getCollection(name).deleteMany({});
  const res = target.getCollection(name).insertMany(docs);
  print(`  ✓ ${name.padEnd(20)} ${Object.keys(res.insertedIds).length} documents`);
}
target.brand_models.deleteMany({});
print(`  · brand_models         0 documents (no real ambassadors yet; add them in the admin later)`);

// Keep each product's ratings summary in sync with its reviews
const summaries = target.reviews.aggregate([
  { $group: { _id: "$productId", average: { $avg: "$rating" }, count: { $sum: 1 } } },
]).toArray();
for (const s of summaries) {
  target.products.updateOne(
    { _id: s._id },
    { $set: { ratings: { average: Math.round(s.average * 10) / 10, count: NumberInt(s.count) } } },
  );
}
print(`  ✓ ratings summary updated on ${summaries.length} products\n`);
