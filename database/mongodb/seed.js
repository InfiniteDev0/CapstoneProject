// =============================================================================
//  LuxuryShop: MongoDB sample data (the "menu album")
// =============================================================================
//  Premium activewear and fashion: 3 categories (Men, Women, Shoes) with their
//  subcategories, 72 products with colour variants, a few reviews and the demo
//  customers' clickstream. The big fake dataset comes in Phase 5.
//
//  Run AFTER init.js:   mongosh --file database/mongodb/seed.js
//  ⚠ Clears and refills every collection.
//
//  Product _ids are FIXED, so MySQL rows (order_items, cart_items, wishlist_items)
//  can point at them and still match after a reset.
//  Pattern: 6750a1000000000000000 + 3-digit code (1xx Men, 2xx Women, 3xx Shoes).
//  userId values are MySQL users.id (2 = Amira, 3 = Layla).
//
//  All names are invented. Products start with NO images: they are added later
//  from the admin. Stock is counted per colour, not per size.
// =============================================================================

const dbName = process.env.MONGODB_DATABASE || "luxuryshop";
const target = db.getSiblingDB(dbName);

const id = (code) => ObjectId(`6750a1000000000000000${code}`);
const usd = (n) => NumberDecimal(n.toFixed(2));
const int = (n) => NumberInt(n);
const day = (iso) => new Date(iso);

// --- sizes -------------------------------------------------------------------
const MEN = ["S", "M", "L", "XL", "XXL"];
const WOMEN = ["XS", "S", "M", "L", "XL"];
const SHOE = ["6", "7", "8", "9", "10", "11", "12"];
const ONE = []; // one size

const SUB_CODE = { topwear: "TOP", bottomwear: "BOT", outerwear: "OUT", accessories: "ACC", running: "RUN", training: "TRN", lifestyle: "LIF" };
const CAT_CODE = { men: "M", women: "W", shoes: "S" };
const slugify = (s) => s.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * One product.
 * colours: [[name, hex, stock], ...]; the first is the default.
 * opts: { isNew, best, tags, sizes, attrs, days (age in days, for "newest") }
 */
const P = (code, category, sub, name, price, description, colours, opts = {}) => {
  const createdAt = new Date(Date.UTC(2026, 10, 12) - (opts.days ?? 120) * 86400000);
  return {
    _id: id(code),
    name,
    slug: slugify(name),
    description,
    category,
    subCategory: sub,
    basePrice: usd(price),
    discountPercent: int(0),
    status: opts.status ?? "LIVE",
    isNew: !!opts.isNew,
    isBestSeller: !!opts.best,
    tags: opts.tags ?? [],
    images: [], // added later from the admin (the shop shows a blank box until then)
    sizes: opts.sizes ?? (category === "men" ? MEN : category === "women" ? WOMEN : SHOE),
    attributes: opts.attrs ?? {},
    variants: colours.map(([colorName, colorHex, stock], i) => ({
      sku: `LS-${CAT_CODE[category]}-${SUB_CODE[sub]}-${String(code).slice(-2)}-${colorName.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()}`,
      colorName, colorHex, stock: int(stock), priceOverride: null, images: [], isDefault: i === 0,
    })),
    ratings: { average: 0, count: int(0) },
    createdAt,
    updatedAt: createdAt,
  };
};

// --- colours -----------------------------------------------------------------
const ONYX = ["Onyx", "#111111"], BONE = ["Bone", "#e8e2d6"], SLATE = ["Slate", "#5a6270"], NAVY = ["Navy", "#1f2a44"];
const IVORY = ["Ivory", "#f5f2ea"], CHARCOAL = ["Charcoal", "#36393d"], OLIVE = ["Olive", "#4b5320"], STONE = ["Stone", "#b8b0a2"];
const HEATHER = ["Heather Grey", "#9a9a9a"], MIDNIGHT = ["Midnight", "#191c2b"], FOREST = ["Forest", "#2f4f3a"], CAMEL = ["Camel", "#b4885a"];
const ECRU = ["Ecru", "#ede6d6"], SAND = ["Sand", "#cbb994"], COGNAC = ["Cognac", "#8a4b24"], BLUSH = ["Blush", "#e7c4bd"];
const SAGE = ["Sage", "#9caf88"], PLUM = ["Plum", "#4e2a3a"], MOCHA = ["Mocha", "#6f4e37"], CLARET = ["Claret", "#6d1f2c"];
const WHITE = ["Chalk White", "#f4f4f1"], SILVER = ["Silver Mist", "#c8ccd0"], TAN = ["Tan", "#a8754a"];
const c = (colour, stock) => [colour[0], colour[1], stock];

// -----------------------------------------------------------------------------
// Categories
// -----------------------------------------------------------------------------
const categories = [
  { name: "Men", slug: "men", displayOrder: int(1), image: null,
    description: "Tailored performance and refined layers for every day.",
    subCategories: [{ slug: "topwear", name: "Topwear" }, { slug: "bottomwear", name: "Bottomwear" },
      { slug: "outerwear", name: "Outerwear" }, { slug: "accessories", name: "Accessories" }] },
  { name: "Women", slug: "women", displayOrder: int(2), image: null,
    description: "Sculpted activewear and quiet-luxury outer layers.",
    subCategories: [{ slug: "topwear", name: "Topwear" }, { slug: "bottomwear", name: "Bottomwear" },
      { slug: "outerwear", name: "Outerwear" }, { slug: "accessories", name: "Accessories" }] },
  { name: "Shoes", slug: "shoes", displayOrder: int(3), image: null,
    description: "Running, training and lifestyle shoes, made to last.",
    subCategories: [{ slug: "running", name: "Running" }, { slug: "training", name: "Training" }, { slug: "lifestyle", name: "Lifestyle" }] },
];

// -----------------------------------------------------------------------------
// Products: 28 Men, 28 Women, 16 Shoes
// -----------------------------------------------------------------------------
const products = [
  // ---- Men · Topwear ----------------------------------------------------------
  P(101, "men", "topwear", "Men's Aero Knit Tee", 120, "A featherweight merino-silk tee that breathes on the move and drapes like tailoring off duty.",
    [c(ONYX, 24), c(BONE, 18), c(SLATE, 12)], { isNew: true, days: 9, tags: ["merino", "travel"], attrs: { Material: "70% merino wool, 30% silk", Fit: "Tailored", Care: "Cool hand wash" } }),
  P(102, "men", "topwear", "Men's Pima Performance Polo", 165, "Long-staple Pima piqué with a hidden stretch knit, finished with mother-of-pearl buttons.",
    [c(NAVY, 30), c(IVORY, 22)], { best: true, days: 210, tags: ["pima", "golf"], attrs: { Material: "Pima cotton piqué", Fit: "Regular", Collar: "Knitted" } }),
  P(103, "men", "topwear", "Men's Merino Base Layer Crew", 145, "Next-to-skin merino that regulates temperature from a cold start to the last mile.",
    [c(CHARCOAL, 20), c(OLIVE, 14)], { days: 160, tags: ["merino", "running"], attrs: { Material: "100% superfine merino", Weight: "150 gsm", Fit: "Close" } }),
  P(104, "men", "topwear", "Men's Silk-Blend Training Tank", 110, "A cool, quick-dry tank with a silk touch and laser-cut ventilation.",
    [c(ONYX, 26), c(STONE, 15)], { days: 140, tags: ["training"], attrs: { Material: "Silk-modal blend", Fit: "Athletic", Feature: "Laser-cut vents" } }),
  P(105, "men", "topwear", "Men's Cashmere Hoodie", 520, "Two-ply Mongolian cashmere cut as a relaxed hoodie, for recovery days that still look sharp.",
    [c(HEATHER, 10), c(MIDNIGHT, 8)], { best: true, days: 300, tags: ["cashmere", "lounge"], attrs: { Material: "100% cashmere, 2-ply", Fit: "Relaxed", Care: "Dry clean" } }),
  P(106, "men", "topwear", "Men's Half-Zip Thermal Pullover", 240, "Grid-fleece warmth under a smooth face, with a brushed-gold zip pull.",
    [c(FOREST, 16), c(ONYX, 20)], { isNew: true, days: 14, tags: ["thermal", "outdoor"], attrs: { Material: "Recycled grid fleece", Fit: "Regular", Zip: "Half zip" } }),
  P(107, "men", "topwear", "Men's Pique Henley", 135, "A long-sleeve henley in garment-dyed piqué with horn buttons.",
    [c(ECRU, 18), c(NAVY, 12)], { days: 190, tags: ["cotton"], attrs: { Material: "Organic cotton piqué", Fit: "Slim", Sleeve: "Long" } }),

  // ---- Men · Bottomwear -------------------------------------------------------
  P(108, "men", "bottomwear", "Men's Tailored Jogger", 210, "Technical wool with four-way stretch, a tapered leg and a clean flat front.",
    [c(CHARCOAL, 22), c(ONYX, 25), c(NAVY, 10)], { best: true, days: 250, tags: ["wool", "travel"], attrs: { Material: "Technical wool", Fit: "Tapered", Rise: "Mid" } }),
  P(109, "men", "bottomwear", "Men's Featherweight Run Short", 115, "A 5-inch run short with a bonded hem and a zip pocket for keys and cards.",
    [c(ONYX, 30), c(SLATE, 18)], { isNew: true, days: 6, tags: ["running"], attrs: { Material: "Recycled ripstop", Inseam: "5 in", Lining: "Mesh brief" } }),
  P(110, "men", "bottomwear", "Men's Stretch Twill Chino", 195, "Italian stretch twill cut slim, made to move from the studio to dinner.",
    [c(SAND, 20), c(NAVY, 16)], { days: 200, tags: ["twill"], attrs: { Material: "Italian cotton twill", Fit: "Slim", Rise: "Mid" } }),
  P(111, "men", "bottomwear", "Men's Compression Tight", 140, "Graduated compression with flatlock seams for long sessions and quick recovery.",
    [c(ONYX, 28)], { days: 170, tags: ["compression", "training"], attrs: { Material: "Nylon-elastane", Fit: "Compression", Seams: "Flatlock" } }),
  P(112, "men", "bottomwear", "Men's Cashmere Lounge Pant", 480, "Brushed cashmere lounge trousers with a drawcord waist and ribbed cuffs.",
    [c(HEATHER, 6), c(CAMEL, 4)], { days: 280, tags: ["cashmere", "lounge"], attrs: { Material: "100% cashmere", Fit: "Relaxed", Care: "Dry clean" } }),
  P(113, "men", "bottomwear", "Men's 7\" Training Short", 120, "A training short with a stretch-woven shell and a soft liner.",
    [c(ONYX, 24), c(OLIVE, 14)], { days: 120, tags: ["training"], attrs: { Material: "Stretch woven", Inseam: "7 in", Lining: "Brief liner" } }),
  P(114, "men", "bottomwear", "Men's Travel Trouser", 260, "Wrinkle-resistant trousers with hidden security pockets and a water-repellent finish.",
    [c(NAVY, 18), c(CHARCOAL, 15)], { isNew: true, days: 20, tags: ["travel"], attrs: { Material: "Stretch nylon", Fit: "Straight", Finish: "Water-repellent" } }),

  // ---- Men · Outerwear --------------------------------------------------------
  P(115, "men", "outerwear", "Men's Alpine Down Parka", 890, "Responsibly sourced 800-fill down in a matte shell, with a detachable hood.",
    [c(ONYX, 9), c(OLIVE, 6)], { best: true, days: 330, tags: ["down", "winter"], attrs: { Fill: "800-fill RDS down", Shell: "Matte nylon", Hood: "Detachable" } }),
  P(116, "men", "outerwear", "Men's Storm Shell Jacket", 620, "A three-layer waterproof shell with taped seams and a helmet-ready hood.",
    [c(SLATE, 12), c(ONYX, 14)], { isNew: true, days: 11, tags: ["waterproof", "outdoor"], attrs: { Shell: "3-layer waterproof", Seams: "Fully taped", Weight: "380 g" } }),
  P(117, "men", "outerwear", "Men's Quilted Liner Vest", 340, "A lightweight quilted vest that layers under a coat or stands alone.",
    [c(NAVY, 15), c(OLIVE, 10)], { days: 220, tags: ["layering"], attrs: { Fill: "Synthetic insulation", Fit: "Regular", Pockets: "Zip hand pockets" } }),
  P(118, "men", "outerwear", "Men's Merino Track Jacket", 380, "A track jacket knitted from merino with a two-way zip and rib trims.",
    [c(MIDNIGHT, 11), c(CHARCOAL, 9)], { days: 150, tags: ["merino"], attrs: { Material: "Merino double-knit", Fit: "Regular", Zip: "Two-way" } }),
  P(119, "men", "outerwear", "Men's Wool-Cashmere Overcoat", 1150, "A double-faced wool-cashmere overcoat, unlined and hand-finished.",
    [c(CAMEL, 2), c(CHARCOAL, 5)], { best: true, days: 360, tags: ["cashmere", "tailoring"], attrs: { Material: "90% wool, 10% cashmere", Construction: "Double-faced, unlined", Length: "Knee" } }),
  P(120, "men", "outerwear", "Men's Packable Wind Jacket", 290, "A 90-gram wind jacket that packs into its own chest pocket.",
    [c(STONE, 20), c(ONYX, 18)], { isNew: true, days: 4, tags: ["running", "travel"], attrs: { Shell: "Ripstop nylon", Weight: "90 g", Packable: "Into chest pocket" } }),
  P(121, "men", "outerwear", "Men's Leather Bomber", 1450, "Vegetable-tanned lambskin bomber with a quilted lining and knitted trims.",
    [c(ONYX, 4), c(COGNAC, 3)], { days: 400, tags: ["leather"], attrs: { Material: "Lambskin leather", Lining: "Quilted", Fit: "Regular" } }),

  // ---- Men · Accessories ------------------------------------------------------
  P(122, "men", "accessories", "Men's Leather Gym Duffel", 640, "Full-grain leather duffel with a ventilated shoe pocket and brass hardware.",
    [c(COGNAC, 8), c(ONYX, 6)], { best: true, days: 260, sizes: ONE, tags: ["leather", "gym"], attrs: { Material: "Full-grain leather", Capacity: "40 L", Hardware: "Solid brass" } }),
  P(123, "men", "accessories", "Men's Canvas Weekender", 420, "Waxed canvas weekender trimmed in leather, sized for carry-on.",
    [c(SAND, 10), c(OLIVE, 7)], { days: 180, sizes: ONE, tags: ["travel"], attrs: { Material: "Waxed canvas, leather trim", Capacity: "35 L", Carry: "Cabin size" } }),
  P(124, "men", "accessories", "Men's Cashmere Scarf", 260, "A generous cashmere scarf with hand-twisted fringes.",
    [c(CHARCOAL, 14), c(CAMEL, 11)], { days: 240, sizes: ONE, tags: ["cashmere", "winter"], attrs: { Material: "100% cashmere", Size: "180 x 30 cm" } }),
  P(125, "men", "accessories", "Men's Merino Beanie", 85, "A ribbed merino beanie that keeps its shape wash after wash.",
    [c(HEATHER, 30), c(ONYX, 25)], { isNew: true, days: 15, sizes: ONE, tags: ["merino", "winter"], attrs: { Material: "Extra-fine merino", Knit: "2x2 rib" } }),
  P(126, "men", "accessories", "Men's Fisherman Beanie", 90, "A short-crown fisherman beanie in a dense wool knit.",
    [c(ONYX, 20), c(NAVY, 16)], { days: 130, sizes: ONE, tags: ["winter"], attrs: { Material: "Lambswool", Fit: "Short crown" } }),
  P(127, "men", "accessories", "Men's Leather Training Gloves", 150, "Perforated lambskin gloves with a padded palm for grip and comfort.",
    [c(ONYX, 15)], { days: 110, sizes: ["S", "M", "L", "XL"], tags: ["leather", "training"], attrs: { Material: "Lambskin", Palm: "Padded", Closure: "Hook and loop" } }),
  P(128, "men", "accessories", "Men's Woven Leather Belt", 190, "Hand-woven calfskin belt with a brushed silver buckle.",
    [c(COGNAC, 12), c(ONYX, 14)], { days: 230, sizes: ["30", "32", "34", "36", "38"], tags: ["leather"], attrs: { Material: "Woven calfskin", Buckle: "Brushed silver", Width: "3.5 cm" } }),

  // ---- Women · Topwear --------------------------------------------------------
  P(201, "women", "topwear", "Women's Sculpt Seamless Bra", 110, "A seamless medium-support bra that sculpts and stays put.",
    [c(ONYX, 26), c(BLUSH, 18), c(SAGE, 12)], { isNew: true, days: 8, tags: ["yoga", "seamless"], attrs: { Support: "Medium", Material: "Seamless nylon-elastane", Pads: "Removable" } }),
  P(202, "women", "topwear", "Women's Silk Jersey Tee", 135, "A silk-jersey tee with a soft sheen and a relaxed drop shoulder.",
    [c(IVORY, 22), c(ONYX, 20)], { best: true, days: 240, tags: ["silk"], attrs: { Material: "Silk jersey", Fit: "Relaxed", Care: "Hand wash" } }),
  P(203, "women", "topwear", "Women's Cropped Cashmere Hoodie", 490, "A cropped cashmere hoodie with dropped shoulders and a deep rib hem.",
    [c(BLUSH, 9), c(HEATHER, 8)], { days: 260, tags: ["cashmere", "lounge"], attrs: { Material: "100% cashmere", Fit: "Cropped", Care: "Dry clean" } }),
  P(204, "women", "topwear", "Women's Ribbed Merino Long Sleeve", 160, "A fine-rib merino long sleeve that layers under everything.",
    [c(ONYX, 18), c(PLUM, 10)], { days: 150, tags: ["merino"], attrs: { Material: "Merino rib", Fit: "Slim", Sleeve: "Long" } }),
  P(205, "women", "topwear", "Women's Airflow Training Tank", 95, "A featherlight racerback tank with a mesh back panel.",
    [c(WHITE, 24), c(ONYX, 22)], { days: 100, tags: ["training"], attrs: { Material: "Recycled poly-mesh", Fit: "Racerback" } }),
  P(206, "women", "topwear", "Women's Wrap Yoga Top", 140, "A wrap-front long sleeve in buttery second-skin fabric.",
    [c(SAGE, 14), c(MOCHA, 12)], { isNew: true, days: 12, tags: ["yoga"], attrs: { Material: "Brushed nylon-elastane", Fit: "Wrap front" } }),
  P(207, "women", "topwear", "Women's Half-Zip Fleece Pullover", 230, "A cloud-soft half zip in recycled fleece with a stand collar.",
    [c(IVORY, 16), c(FOREST, 10)], { days: 190, tags: ["fleece", "outdoor"], attrs: { Material: "Recycled fleece", Fit: "Relaxed", Zip: "Half zip" } }),

  // ---- Women · Bottomwear -----------------------------------------------------
  P(208, "women", "bottomwear", "Women's Sculpt Seamless Legging", 185, "Our best-selling seamless legging: high-rise, squat-proof and sculpting.",
    [c(ONYX, 35), c(SAGE, 20), c(PLUM, 14)], { best: true, days: 300, tags: ["yoga", "seamless"], attrs: { Rise: "High", Material: "Seamless nylon-elastane", Length: "7/8" } }),
  P(209, "women", "bottomwear", "Women's High-Rise Run Short", 105, "A 3-inch run short with a built-in liner and back zip pocket.",
    [c(ONYX, 25), c(BLUSH, 15)], { days: 120, tags: ["running"], attrs: { Inseam: "3 in", Lining: "Built-in brief", Pocket: "Back zip" } }),
  P(210, "women", "bottomwear", "Women's Wide-Leg Lounge Pant", 260, "Fluid wide-leg trousers in a crepe that never creases.",
    [c(IVORY, 14), c(ONYX, 16)], { days: 170, tags: ["lounge"], attrs: { Material: "Stretch crepe", Fit: "Wide leg", Rise: "High" } }),
  P(211, "women", "bottomwear", "Women's Pleated Tennis Skirt", 150, "A pleated court skirt with built-in shorts and a ball pocket.",
    [c(WHITE, 18), c(NAVY, 12)], { isNew: true, days: 10, tags: ["tennis"], attrs: { Material: "Stretch woven", Lining: "Built-in shorts", Length: "Mini" } }),
  P(212, "women", "bottomwear", "Women's Flare Yoga Pant", 175, "A flared yoga pant with a crossover waistband.",
    [c(ONYX, 22), c(MOCHA, 12)], { days: 140, tags: ["yoga"], attrs: { Material: "Brushed nylon-elastane", Fit: "Flare", Waist: "Crossover" } }),
  P(213, "women", "bottomwear", "Women's Cashmere Jogger", 460, "A slim cashmere jogger with a satin drawcord.",
    [c(HEATHER, 7), c(CAMEL, 5)], { days: 280, tags: ["cashmere", "lounge"], attrs: { Material: "100% cashmere", Fit: "Slim", Care: "Dry clean" } }),
  P(214, "women", "bottomwear", "Women's Sculpt Bike Short", 95, "A 6-inch seamless bike short that matches the Sculpt bra.",
    [c(ONYX, 28), c(SAGE, 16)], { days: 90, tags: ["seamless", "training"], attrs: { Inseam: "6 in", Material: "Seamless nylon-elastane" } }),

  // ---- Women · Outerwear ------------------------------------------------------
  P(215, "women", "outerwear", "Women's Cropped Puffer Jacket", 690, "A cropped down puffer in a glossy shell with a funnel neck.",
    [c(ONYX, 10), c(IVORY, 7)], { isNew: true, days: 5, tags: ["down", "winter"], attrs: { Fill: "700-fill RDS down", Shell: "Glossy nylon", Fit: "Cropped" } }),
  P(216, "women", "outerwear", "Women's Belted Wool Coat", 1190, "A double-breasted wool-cashmere coat with a tie belt and horn buttons.",
    [c(CAMEL, 3), c(ONYX, 6)], { best: true, days: 350, tags: ["cashmere", "tailoring"], attrs: { Material: "80% wool, 20% cashmere", Length: "Midi", Closure: "Double-breasted, belted" } }),
  P(217, "women", "outerwear", "Women's Lightweight Running Jacket", 280, "A water-resistant running jacket with reflective trims.",
    [c(SILVER, 18), c(ONYX, 20)], { best: true, days: 160, tags: ["running"], attrs: { Shell: "Water-resistant nylon", Weight: "140 g", Visibility: "Reflective trims" } }),
  P(218, "women", "outerwear", "Women's Quilted Vest", 320, "A diamond-quilted vest with snap closure.",
    [c(OLIVE, 12), c(ONYX, 14)], { days: 210, tags: ["layering"], attrs: { Fill: "Synthetic insulation", Closure: "Snaps" } }),
  P(219, "women", "outerwear", "Women's Storm Trench", 840, "A waterproof trench with storm flaps and a detachable lining.",
    [c(SAND, 8), c(ONYX, 9)], { days: 240, tags: ["waterproof", "tailoring"], attrs: { Shell: "Bonded cotton, waterproof", Lining: "Detachable", Length: "Long" } }),
  P(220, "women", "outerwear", "Women's Fleece-Lined Track Jacket", 350, "A track jacket lined in fleece for cold morning runs.",
    [c(PLUM, 10), c(ONYX, 13)], { days: 130, tags: ["running", "fleece"], attrs: { Lining: "Brushed fleece", Fit: "Regular", Zip: "Two-way" } }),
  P(221, "women", "outerwear", "Women's Longline Down Coat", 980, "A longline down coat with a two-way zip and a faux-fur-free hood.",
    [c(ONYX, 7), c(MOCHA, 5)], { isNew: true, days: 18, tags: ["down", "winter"], attrs: { Fill: "750-fill RDS down", Length: "Below knee", Hood: "Fixed" } }),

  // ---- Women · Accessories ----------------------------------------------------
  P(222, "women", "accessories", "Women's Leather Studio Tote", 580, "A structured leather tote with a padded laptop sleeve and a yoga-mat strap.",
    [c(ONYX, 9), c(COGNAC, 6)], { best: true, days: 270, sizes: ONE, tags: ["leather"], attrs: { Material: "Pebbled calfskin", Fits: "14 in laptop, yoga mat" } }),
  P(223, "women", "accessories", "Women's Silk Twill Scarf", 120, "A hand-rolled silk twill scarf in a quiet geometric print.",
    [c(IVORY, 16), c(CLARET, 10)], { days: 160, sizes: ONE, tags: ["silk"], attrs: { Material: "Silk twill", Size: "90 x 90 cm", Edges: "Hand-rolled" } }),
  P(224, "women", "accessories", "Women's Cashmere Gloves", 160, "Touchscreen-ready cashmere gloves with a ribbed cuff.",
    [c(CAMEL, 12), c(ONYX, 14)], { days: 200, sizes: ["S", "M", "L"], tags: ["cashmere", "winter"], attrs: { Material: "Cashmere", Feature: "Touchscreen fingertips" } }),
  P(225, "women", "accessories", "Women's Gym Crossbody", 340, "A compact leather crossbody for keys, cards and phone.",
    [c(ONYX, 10), c(BLUSH, 8)], { isNew: true, days: 7, sizes: ONE, tags: ["leather"], attrs: { Material: "Smooth calfskin", Strap: "Adjustable webbing" } }),
  P(226, "women", "accessories", "Women's Ribbed Beanie", 90, "A cashmere-blend beanie with a turned-up cuff.",
    [c(IVORY, 18), c(ONYX, 16)], { days: 140, sizes: ONE, tags: ["winter"], attrs: { Material: "Wool-cashmere blend", Knit: "Rib" } }),
  P(227, "women", "accessories", "Women's Performance Visor", 80, "A lightweight visor with a sweat-wicking band.",
    [c(WHITE, 20), c(ONYX, 15)], { days: 80, sizes: ONE, tags: ["tennis", "running"], attrs: { Material: "Recycled poly", Band: "Sweat-wicking" } }),
  P(228, "women", "accessories", "Women's Leather Belt Bag", 390, "A leather belt bag that wears at the waist or across the body.",
    [c(ONYX, 11), c(TAN, 6)], { best: true, days: 220, sizes: ONE, tags: ["leather"], attrs: { Material: "Calfskin", Strap: "Adjustable leather" } }),

  // ---- Shoes · Running --------------------------------------------------------
  P(301, "shoes", "running", "Stratus Runner", 420, "A daily trainer with a responsive foam midsole and a knit upper that moves with you.",
    [c(ONYX, 22), c(WHITE, 18), c(SILVER, 10)], { isNew: true, best: true, days: 10, tags: ["running", "knit"], attrs: { Upper: "Engineered knit", Midsole: "Responsive foam", Drop: "8 mm" } }),
  P(302, "shoes", "running", "Aerolite Racer", 380, "A race-day flat with a carbon-infused plate and a featherweight mesh.",
    [c(WHITE, 14), c(ONYX, 12)], { days: 150, tags: ["running", "race"], attrs: { Upper: "Mono mesh", Plate: "Carbon-infused", Weight: "190 g" } }),
  P(303, "shoes", "running", "Cloudline Trail", 450, "A trail shoe with a lugged outsole and a water-repellent upper.",
    [c(OLIVE, 12), c(CHARCOAL, 10)], { days: 200, tags: ["trail"], attrs: { Upper: "Water-repellent mesh", Outsole: "5 mm lugs", Drop: "6 mm" } }),
  P(304, "shoes", "running", "Velocity Knit Runner", 360, "A sock-like knit runner made for easy miles.",
    [c(ONYX, 20), c(BLUSH, 12)], { isNew: true, days: 16, tags: ["running", "knit"], attrs: { Upper: "Sock-fit knit", Midsole: "Cushioned foam", Drop: "10 mm" } }),
  P(305, "shoes", "running", "Marathon Elite", 520, "Our most cushioned long-distance shoe, with a rocker sole that rolls you forward.",
    [c(WHITE, 6), c(ONYX, 0)], { days: 260, tags: ["running", "race"], attrs: { Upper: "Engineered mesh", Midsole: "Max-cushion foam", Geometry: "Rocker" } }),
  P(306, "shoes", "running", "Night Run Reflective", 395, "A 360° reflective runner for dark mornings and late evenings.",
    [c(SILVER, 10), c(ONYX, 14)], { days: 120, tags: ["running"], attrs: { Upper: "Reflective knit", Midsole: "Responsive foam" } }),

  // ---- Shoes · Training -------------------------------------------------------
  P(307, "shoes", "training", "Forge Cross Trainer", 340, "A stable, low-to-the-ground trainer for lifting and HIIT.",
    [c(ONYX, 24), c(WHITE, 15)], { best: true, days: 230, tags: ["training", "gym"], attrs: { Upper: "Reinforced mesh", Heel: "Flat, stable", Outsole: "Multi-court rubber" } }),
  P(308, "shoes", "training", "Studio Trainer", 290, "A lightweight studio shoe with a flexible forefoot.",
    [c(BLUSH, 12), c(ONYX, 14)], { days: 140, tags: ["training", "studio"], attrs: { Upper: "Knit", Outsole: "Flexible rubber" } }),
  P(309, "shoes", "training", "Apex Lifting Shoe", 410, "A raised-heel lifting shoe with a locking strap.",
    [c(ONYX, 8)], { days: 300, tags: ["training", "gym"], attrs: { Heel: "Raised 18 mm", Closure: "Laces and strap" } }),
  P(310, "shoes", "training", "Court Agility Trainer", 320, "A court-ready trainer for quick cuts and lateral moves.",
    [c(WHITE, 16), c(SLATE, 10)], { isNew: true, days: 21, tags: ["training", "tennis"], attrs: { Upper: "Synthetic leather", Outsole: "Herringbone rubber" } }),
  P(311, "shoes", "training", "Pilates Slip-On", 240, "A minimal slip-on with a grippy sole for reformer and mat.",
    [c(BLUSH, 14), c(ONYX, 12)], { days: 110, tags: ["studio", "pilates"], attrs: { Upper: "Stretch knit", Outsole: "Grip rubber" } }),

  // ---- Shoes · Lifestyle ------------------------------------------------------
  P(312, "shoes", "lifestyle", "Heritage Leather Sneaker", 480, "A clean low-top in full-grain Italian leather, hand-stitched on a cupsole.",
    [c(WHITE, 26), c(ONYX, 18)], { best: true, days: 320, tags: ["leather"], attrs: { Upper: "Italian full-grain leather", Sole: "Stitched cupsole", Lining: "Calfskin" } }),
  P(313, "shoes", "lifestyle", "Suede Chelsea Boot", 620, "A suede Chelsea boot with elastic gussets and a crepe sole.",
    [c(TAN, 10), c(ONYX, 8)], { days: 250, tags: ["suede", "boots"], attrs: { Upper: "Water-repellent suede", Sole: "Natural crepe" } }),
  P(314, "shoes", "lifestyle", "Riviera Leather Derby", 440, "A soft leather derby with a lightweight rubber sole.",
    [c(COGNAC, 12), c(MOCHA, 9)], { days: 180, tags: ["leather"], attrs: { Upper: "Burnished leather", Sole: "Lightweight rubber" } }),
  P(315, "shoes", "lifestyle", "Platform Court Sneaker", 390, "A leather court sneaker on a sculpted platform sole.",
    [c(WHITE, 14), c(BLUSH, 9)], { isNew: true, days: 13, tags: ["leather", "platform"], attrs: { Upper: "Calf leather", Sole: "4 cm platform" } }),
  P(316, "shoes", "lifestyle", "Mono Knit Loafer", 360, "A knit loafer that packs flat for travel.",
    [c(ONYX, 15), c(STONE, 10)], { days: 160, tags: ["knit", "travel"], attrs: { Upper: "Knit", Sole: "Foldable rubber" } }),
];

// -----------------------------------------------------------------------------
// Reviews (userId = MySQL users.id: 2 Amira, 3 Layla)
// -----------------------------------------------------------------------------
const reviews = [
  { productId: id("208"), userId: int(2), userName: "Amira H.", rating: int(5), title: "Worth every penny",
    comment: "Squat-proof, holds its shape and the onyx is a true black.", verifiedPurchase: false, createdAt: day("2026-09-25T18:00:00Z") },
  { productId: id("301"), userId: int(2), userName: "Amira H.", rating: int(5), title: "Like running on air",
    comment: "Light, springy and they look smart enough to wear out.", verifiedPurchase: false, createdAt: day("2026-09-26T18:10:00Z") },
  { productId: id("202"), userId: int(3), userName: "Layla M.", rating: int(4), title: "Beautiful drape",
    comment: "So soft. It runs a little big, so size down.", verifiedPurchase: false, createdAt: day("2026-08-22T10:00:00Z") },
  { productId: id("228"), userId: int(3), userName: "Layla M.", rating: int(5), title: "My everyday bag",
    comment: "Fits phone, keys and cards, and the leather is gorgeous.", verifiedPurchase: false, createdAt: day("2026-08-22T10:05:00Z") },
  { productId: id("216"), userId: int(2), userName: "Amira H.", rating: int(4), title: "Stunning coat",
    comment: "Warm without the bulk. The camel colour is perfect.", verifiedPurchase: false, createdAt: day("2026-10-10T12:00:00Z") },
  { productId: id("312"), userId: int(3), userName: "Layla M.", rating: int(5), title: "The perfect white sneaker",
    comment: "Comfortable from day one and the leather is buttery.", verifiedPurchase: false, createdAt: day("2026-07-30T09:00:00Z") },
  { productId: id("217"), userId: int(3), userName: "Layla M.", rating: int(4), title: "Great for rainy runs",
    comment: "Keeps the drizzle out and the reflective trim is a nice touch.", verifiedPurchase: false, createdAt: day("2026-09-02T07:30:00Z") },
  { productId: id("105"), userId: int(2), userName: "Amira H.", rating: int(5), title: "Bought it for my brother",
    comment: "He lives in it. The cashmere is thick and soft.", verifiedPurchase: false, createdAt: day("2026-10-20T20:00:00Z") },
];

// -----------------------------------------------------------------------------
// Clickstream: a few browsing sessions for the demo customers (no purchases: there are no sample orders)
// -----------------------------------------------------------------------------
const ev = (userId, sessionId, type, device, iso, extra = {}) => ({
  userId: int(userId), sessionId, type, device, timestamp: day(iso),
  productId: null, category: null, query: null, orderId: null, page: "/", ...extra,
});
const clickstream = [
  ev(2, "sess-amira-20260918", "SEARCH", "MOBILE", "2026-09-18T19:40:00Z", { query: "seamless legging", page: "/categories/women" }),
  ev(2, "sess-amira-20260918", "VIEW", "MOBILE", "2026-09-18T19:41:10Z", { productId: id("208"), category: "women", page: "/product/womens-sculpt-seamless-legging" }),
  ev(2, "sess-amira-20260918", "ADD_TO_CART", "MOBILE", "2026-09-18T19:43:40Z", { productId: id("208"), category: "women", page: "/product/womens-sculpt-seamless-legging" }),
  ev(2, "sess-amira-20260918", "VIEW", "MOBILE", "2026-09-18T19:45:00Z", { productId: id("301"), category: "shoes", page: "/product/stratus-runner" }),
  ev(2, "sess-amira-20260918", "ADD_TO_CART", "MOBILE", "2026-09-18T19:46:20Z", { productId: id("301"), category: "shoes", page: "/product/stratus-runner" }),
  ev(2, "sess-amira-20261102", "VIEW", "DESKTOP", "2026-11-02T10:05:00Z", { productId: id("215"), category: "women", page: "/product/womens-cropped-puffer-jacket" }),
  ev(2, "sess-amira-20261102", "VIEW", "DESKTOP", "2026-11-02T10:07:00Z", { productId: id("216"), category: "women", page: "/product/womens-belted-wool-coat" }),
  ev(2, "sess-amira-20261102", "WISHLIST", "DESKTOP", "2026-11-02T10:07:40Z", { productId: id("216"), category: "women", page: "/product/womens-belted-wool-coat" }),
  ev(2, "sess-amira-20261102", "ADD_TO_CART", "DESKTOP", "2026-11-02T10:09:00Z", { productId: id("215"), category: "women", page: "/product/womens-cropped-puffer-jacket" }),
  ev(3, "sess-layla-20260815", "SEARCH", "MOBILE", "2026-08-15T12:50:00Z", { query: "belt bag", page: "/categories/women" }),
  ev(3, "sess-layla-20260815", "VIEW", "MOBILE", "2026-08-15T12:51:00Z", { productId: id("228"), category: "women", page: "/product/womens-leather-belt-bag" }),
  ev(3, "sess-layla-20260815", "ADD_TO_CART", "MOBILE", "2026-08-15T12:53:30Z", { productId: id("228"), category: "women", page: "/product/womens-leather-belt-bag" }),
  ev(3, "sess-layla-20260815", "VIEW", "MOBILE", "2026-08-15T12:57:00Z", { productId: id("202"), category: "women", page: "/product/womens-silk-jersey-tee" }),
  ev(3, "sess-layla-20260815", "ADD_TO_CART", "MOBILE", "2026-08-15T12:58:10Z", { productId: id("202"), category: "women", page: "/product/womens-silk-jersey-tee" }),
  ev(3, "sess-layla-20261005", "VIEW", "MOBILE", "2026-10-05T21:00:00Z", { productId: id("215"), category: "women", page: "/product/womens-cropped-puffer-jacket" }),
  ev(3, "sess-layla-20261005", "WISHLIST", "MOBILE", "2026-10-05T21:01:00Z", { productId: id("215"), category: "women", page: "/product/womens-cropped-puffer-jacket" }),
];

// -----------------------------------------------------------------------------
// Write everything
// -----------------------------------------------------------------------------
print(`\nSeeding MongoDB database "${dbName}"\n`);
for (const [name, docs] of [
  ["categories", categories],
  ["products", products],
  ["reviews", reviews],
  ["clickstream_events", clickstream],
]) {
  target.getCollection(name).deleteMany({});
  const res = target.getCollection(name).insertMany(docs);
  print(`  ✓ ${name.padEnd(20)} ${Object.keys(res.insertedIds).length} documents`);
}

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
