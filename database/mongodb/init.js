// =============================================================================
//  LuxuryShop: MongoDB setup (the "menu album")
// =============================================================================
//  Creates every collection with its $jsonSchema validator (the house rules,
//  in ./schemas) and its indexes (the album's index pages).
//
//  Run from the project root:   mongosh --file database/mongodb/init.js
//  ⚠ This RESETS the album: existing collections are dropped and recreated.
//
//  Database name: MONGODB_DATABASE env var, default "luxuryshop".
// =============================================================================

const fs = require("fs");
const path = require("path");

const dbName = process.env.MONGODB_DATABASE || "luxuryshop";
const target = db.getSiblingDB(dbName);
const schemaDir = path.join(__dirname, "schemas");

const collections = ["categories", "products", "reviews", "clickstream_events"];
// Leftovers from the old catalogue, removed if they exist
for (const old of ["collections", "brand_models"]) if (target.getCollectionNames().includes(old)) target.getCollection(old).drop();

print(`\nSetting up MongoDB database "${dbName}"\n`);

for (const name of collections) {
  const validator = JSON.parse(fs.readFileSync(path.join(schemaDir, `${name}.json`), "utf8"));
  if (target.getCollectionNames().includes(name)) target.getCollection(name).drop();
  target.createCollection(name, {
    validator,
    validationLevel: "strict", // check every insert and update
    validationAction: "error", // reject documents that break the rules
  });
  print(`  ✓ ${name} (with validator)`);
}

// --- Indexes -----------------------------------------------------------------
// categories: looked up by slug in URLs
target.categories.createIndex({ slug: 1 }, { unique: true, name: "uq_slug" });
target.categories.createIndex({ displayOrder: 1 }, { name: "ix_display_order" });

// products
target.products.createIndex({ slug: 1 }, { unique: true, name: "uq_slug" });
target.products.createIndex({ "variants.sku": 1 }, { unique: true, name: "uq_variant_sku" });
target.products.createIndex({ category: 1, status: 1, basePrice: 1 }, { name: "ix_browse_category_price" });
target.products.createIndex({ category: 1, subCategory: 1 }, { name: "ix_category_sub" });
target.products.createIndex({ isNew: 1, createdAt: -1 }, { name: "ix_new" });
target.products.createIndex({ tags: 1 }, { name: "ix_tags" });
target.products.createIndex(
  { name: "text", description: "text", tags: "text" },
  { name: "tx_search", weights: { name: 10, tags: 5, description: 1 }, default_language: "english" },
);

// reviews: newest first per product; one review per customer per product
target.reviews.createIndex({ productId: 1, createdAt: -1 }, { name: "ix_product_newest" });
target.reviews.createIndex({ productId: 1, userId: 1 }, { unique: true, name: "uq_one_review_per_user" });
target.reviews.createIndex({ userId: 1 }, { name: "ix_user" });

// clickstream: a customer's history (churn), a product's activity (recommender)
target.clickstream_events.createIndex({ userId: 1, timestamp: -1 }, { name: "ix_user_time" });
target.clickstream_events.createIndex({ productId: 1, timestamp: -1 }, { name: "ix_product_time" });
target.clickstream_events.createIndex({ type: 1, timestamp: -1 }, { name: "ix_type_time" });
target.clickstream_events.createIndex({ sessionId: 1 }, { name: "ix_session" });

print("\n  ✓ indexes created\n");
for (const name of collections) {
  const names = target.getCollection(name).getIndexes().map((i) => i.name).join(", ");
  print(`  ${name.padEnd(20)} ${names}`);
}
print(`\nDone. Next: mongosh --file database/mongodb/seed.js\n`);
