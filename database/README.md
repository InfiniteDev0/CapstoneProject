# LuxuryShop: Databases

Two databases work together:

- **MySQL**: accounts, carts, orders, payments, churn predictions, retention offers, model metrics.
- **MongoDB**: products, categories, reviews, clickstream events.

The diagram and the reasons for this split are in [`docs/diagrams/er-diagram.md`](../docs/diagrams/er-diagram.md).

```
database/
├── mysql/
│   ├── setup.ps1     creates the database + the luxury_app user (run once, needs root)
│   ├── schema.sql    the 10 tables
│   ├── seed.sql      sample users, devices, wishlist, bag, 5 orders
│   └── reset.ps1     rebuilds the tables and loads the seed (as luxury_app)
└── mongodb/
    ├── schemas/      $jsonSchema validators, one per collection
    ├── init.js       creates the collections, validators and indexes
    └── seed.js       the LuxuryShop catalogue (72 products), reviews and clickstream
```

## 1. Install

| Tool | Version used | Download |
|---|---|---|
| MySQL Server | 9.3 (8.0+ works) | https://dev.mysql.com/downloads/installer/ |
| MongoDB Community Server | 8.x (7.0+ works) | https://www.mongodb.com/try/download/community |
| mongosh (MongoDB Shell) | 2.x | https://www.mongodb.com/try/download/shell |
| MongoDB Compass (optional GUI) | any | https://www.mongodb.com/try/download/compass |

Both servers run as Windows services on their default ports: MySQL on `3306`, MongoDB on `27017`.

## 2. Configure

Copy `.env.example` to `.env` in the project root and set a password for the app user:

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=luxuryshop
MYSQL_USER=luxury_app
MYSQL_PASSWORD=choose-a-strong-password
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=luxuryshop
```

`.env` is git-ignored and is never committed.

## 3. Create and fill MySQL

Run these from the project root in PowerShell.

```powershell
# Once: creates database "luxuryshop" and user "luxury_app" (access to luxuryshop only).
# It asks for the MySQL root password; the root password is never stored.
powershell -ExecutionPolicy Bypass -File database\mysql\setup.ps1

# Builds the tables and loads the sample data, connecting as luxury_app.
powershell -ExecutionPolicy Bypass -File database\mysql\reset.ps1
```

Without PowerShell, the same steps by hand:

```sql
-- as root
CREATE DATABASE luxuryshop CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'luxury_app'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON luxuryshop.* TO 'luxury_app'@'localhost';
```
```bash
mysql -u luxury_app -p luxuryshop < database/mysql/schema.sql
mysql -u luxury_app -p luxuryshop < database/mysql/seed.sql
```

## 4. Create and fill MongoDB

```bash
mongosh --file database/mongodb/init.js   # collections + validators + indexes
mongosh --file database/mongodb/seed.js   # catalogue, reviews, clickstream
```

The scripts use the `MONGODB_DATABASE` environment variable, default `luxuryshop`.
To browse the data in Compass, connect to `mongodb://localhost:27017` and open the `luxuryshop` database.

## 5. Reset everything

⚠ This deletes all data in both `luxuryshop` databases and reloads the sample data.

```powershell
powershell -ExecutionPolicy Bypass -File database\mysql\reset.ps1
mongosh --file database/mongodb/init.js
mongosh --file database/mongodb/seed.js
```

## 6. Check it worked

```sql
-- MySQL (as luxury_app): 10 tables, 3 users, 5 orders
SHOW TABLES;
SELECT id, name, email, role FROM users;
SELECT order_number, status, product_name, sku, selected_size, unit_price
FROM orders o JOIN order_items oi ON oi.order_id = o.id;
```
```js
// mongosh: the two products in order 1
use luxuryshop
db.products.find(
  { _id: { $in: [ObjectId("6750a1000000000000000208"), ObjectId("6750a1000000000000000301")] } },
  { name: 1, basePrice: 1, sizes: 1, "variants.sku": 1 }
)
```

The `product_id` and `sku` in MySQL match the `_id` and `variants.sku` in MongoDB. There is no foreign key across the two databases; the Java backend checks these links.

## The catalogue

| Category | Subcategories | Products |
|---|---|---|
| Men | Topwear, Bottomwear, Outerwear, Accessories | 28 |
| Women | Topwear, Bottomwear, Outerwear, Accessories | 28 |
| Shoes | Running, Training, Lifestyle | 16 |

- All product names are invented (no real brands or trademarks). Prices are premium: about $80 to $1,450.
- Each product has **colour variants** (SKU like `LS-W-BOT-08-ONY`, stock counted per colour), **sizes** (S–XXL, XS–XL, 6–12 or one size) and **attributes** (Material, Fit, Care...). 17 are flagged **New**, 15 **Best seller**, and a few colours are low or sold out so the admin alerts show.
- Products start **without photos**: the shop shows a blank box until the admin uploads photos.
- Product `_id`s are fixed: `6750a1000000000000000` + a 3-digit code (1xx Men, 2xx Women, 3xx Shoes).

## Sample data

| | Count |
|---|---|
| MySQL users | 3 (1 admin, 2 customers) |
| MySQL orders | 5 (delivered, shipped, paid, and one cancelled + refunded) |
| MongoDB products | 72 |
| MongoDB categories | 3 (with their subcategories) |
| MongoDB reviews | 8 |
| MongoDB clickstream events | 19 |

The large practice dataset (hundreds of customers, orders and clicks) is generated in Phase 5.

### Demo logins (sample data only)

The database stores only BCrypt hashes. These plain passwords are listed here so the demo can be run:

| Role | Email | Password | Where |
|---|---|---|---|
| Admin | admin@luxuryshop.local | LuxAdmin#2026 | http://localhost:8080/admin |
| Customer | amira@luxuryshop.local | Amira#Lux26 | http://localhost:8080/login |
| Customer | layla@luxuryshop.local | Layla#Lux26 | http://localhost:8080/login |
