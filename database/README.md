# Vela Noire: Databases

Two databases work together:

- **MySQL**: accounts, carts, orders, payments, churn predictions, retention offers, model metrics.
- **MongoDB**: products, categories, collections, reviews, clickstream events.

The diagram and the reasons for this split are in [`docs/diagrams/er-diagram.md`](../docs/diagrams/er-diagram.md).

```
database/
├── mysql/
│   ├── setup.ps1     creates the database + the vela_app user (run once, needs root)
│   ├── schema.sql    the 10 tables
│   ├── seed.sql      sample users, devices, wishlist, cart, one order
│   └── reset.ps1     rebuilds the tables and loads the seed (as vela_app)
└── mongodb/
    ├── schemas/      $jsonSchema validators, one per collection
    ├── init.js       creates the collections, validators and indexes
    └── seed.js       the Vela Noire catalogue, reviews and clickstream
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
MYSQL_DATABASE=vela_noire
MYSQL_USER=vela_app
MYSQL_PASSWORD=choose-a-strong-password
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=vela_noire
```

`.env` is git-ignored and is never committed.

## 3. Create and fill MySQL

Run these from the project root in PowerShell.

```powershell
# Once: creates database "vela_noire" and user "vela_app" (access to vela_noire only).
# It asks for the MySQL root password; the root password is never stored.
powershell -ExecutionPolicy Bypass -File database\mysql\setup.ps1

# Builds the tables and loads the sample data, connecting as vela_app.
powershell -ExecutionPolicy Bypass -File database\mysql\reset.ps1
```

Without PowerShell, the same steps by hand:

```sql
-- as root
CREATE DATABASE vela_noire CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'vela_app'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON vela_noire.* TO 'vela_app'@'localhost';
```
```bash
mysql -u vela_app -p vela_noire < database/mysql/schema.sql
mysql -u vela_app -p vela_noire < database/mysql/seed.sql
```

## 4. Create and fill MongoDB

```bash
mongosh --file database/mongodb/init.js   # collections + validators + indexes
mongosh --file database/mongodb/seed.js   # catalogue, reviews, clickstream
```

To browse the data in Compass, connect to `mongodb://localhost:27017` and open the `vela_noire` database.

## 5. Reset everything

⚠ This deletes all data in both `vela_noire` databases and reloads the sample data.

```powershell
powershell -ExecutionPolicy Bypass -File database\mysql\reset.ps1
mongosh --file database/mongodb/init.js
mongosh --file database/mongodb/seed.js
```

## 6. Check it worked

```sql
-- MySQL (as vela_app): 10 tables, 3 users, 1 order with 2 items
SHOW TABLES;
SELECT id, name, email, role FROM users;
SELECT order_number, product_id, sku, product_name, unit_price
FROM orders o JOIN order_items oi ON oi.order_id = o.id;
```
```js
// mongosh: the products that order 1 points at
use vela_noire
db.products.find(
  { _id: { $in: [ObjectId("6750a1000000000000000101"), ObjectId("6750a1000000000000000102")] } },
  { name: 1, basePrice: 1, "variants.sku": 1 }
)
```

The `product_id` and `sku` in MySQL match the `_id` and `variants.sku` in MongoDB. There is no foreign key across the two databases; the Java backend checks these links.

## Sample data

| | Count |
|---|---|
| MySQL users | 3 (1 admin, 2 customers) |
| MySQL orders | 1 (Amira: Velvet Moon Abaya + Ruqayyah perfume) |
| MongoDB products | 21 across 4 collections |
| MongoDB categories | 7 |
| MongoDB reviews | 5 |
| MongoDB clickstream events | 11 |

The large practice dataset (hundreds of customers, orders and clicks) is generated in Phase 5.

### Demo logins (sample data only)

The database stores only BCrypt hashes. These plain passwords are listed here so the demo can be run:

| Role | Email | Password |
|---|---|---|
| Admin | admin@velanoire.local | VelaAdmin#2026 |
| Customer | amira@example.com | Amira#Noire26 |
| Customer | layla@example.com | Layla#Noire26 |
