# Vela Noire: Entity-Relationship Diagram

Vela Noire stores its data in two databases, each chosen for what it does best:

| Database | Holds | Why |
|---|---|---|
| **MySQL** (`vela_noire`) | Users, devices, wishlist, cart, orders, order items, payments, churn predictions, retention offers, model metrics | Money and accounts need strict rules: fixed columns, foreign keys and transactions (ACID). |
| **MongoDB** (`vela_noire`) | Products (with variants), categories, collections, reviews, clickstream events | Products differ in shape (an abaya has sizes and lengths; a perfume has scent notes). Clickstream is a fast-growing log. A flexible document store fits both. |

## 1. MySQL tables

```mermaid
erDiagram
    users ||--o{ user_devices      : "uses"
    users ||--o{ wishlist_items    : "hearts"
    users ||--o{ cart_items        : "has in bag"
    users ||--o{ orders            : "places"
    users ||--o{ churn_predictions : "is scored by"
    users ||--o{ retention_offers  : "receives"
    users |o--o{ retention_offers  : "sends (admin)"
    churn_predictions |o--o{ retention_offers : "triggers"
    retention_offers  |o--o{ orders           : "redeemed in"
    orders ||--|{ order_items : "contains"
    orders ||--o{ payments    : "paid by"

    users {
        BIGINT id PK
        VARCHAR name
        VARCHAR email UK
        CHAR password_hash "BCrypt"
        ENUM role "CUSTOMER | ADMIN"
        VARCHAR phone
        VARCHAR country
        VARCHAR city
        ENUM gender
        DATE date_of_birth
        JSON preferred_categories
        BOOLEAN is_active
        DATETIME created_at "tenure starts here"
        DATETIME last_login_at
    }
    user_devices {
        BIGINT id PK
        BIGINT user_id FK
        VARCHAR device_id
        ENUM device_type "DESKTOP | MOBILE | TABLET"
        VARCHAR os
        VARCHAR browser
        DATETIME first_seen
        DATETIME last_seen
    }
    wishlist_items {
        BIGINT id PK
        BIGINT user_id FK
        CHAR product_id "Mongo products._id"
        DATETIME created_at
    }
    cart_items {
        BIGINT id PK
        BIGINT user_id FK
        CHAR product_id "Mongo products._id"
        VARCHAR sku "Mongo variants.sku"
        INT quantity "1 to 20"
        VARCHAR selected_size
        ENUM selected_style
        ENUM shayla_type
    }
    orders {
        BIGINT id PK
        VARCHAR order_number UK
        BIGINT user_id FK
        ENUM status
        DECIMAL subtotal
        DECIMAL discount_amount
        DECIMAL shipping_fee
        DECIMAL total
        BIGINT retention_offer_id FK
        VARCHAR shipping_country
        ENUM device_type
        DATETIME created_at
    }
    order_items {
        BIGINT id PK
        BIGINT order_id FK
        CHAR product_id "Mongo products._id"
        VARCHAR sku
        VARCHAR product_name "snapshot"
        VARCHAR category "snapshot"
        DECIMAL unit_price "snapshot"
        INT quantity
        DECIMAL line_total "generated"
    }
    payments {
        BIGINT id PK
        BIGINT order_id FK
        DECIMAL amount
        ENUM method
        ENUM status
        VARCHAR reference UK "simulated"
        DATETIME paid_at
    }
    churn_predictions {
        BIGINT id PK
        BIGINT user_id FK
        DECIMAL probability "0 to 1"
        ENUM risk_level "HIGH | MEDIUM | LOW"
        JSON top_factors
        VARCHAR model_version
        DATETIME predicted_at
    }
    retention_offers {
        BIGINT id PK
        BIGINT user_id FK "customer"
        BIGINT churn_prediction_id FK
        BIGINT sent_by FK "admin"
        VARCHAR code UK
        TINYINT percent_off
        ENUM status
        DATETIME expires_at
    }
    model_metrics {
        BIGINT id PK
        VARCHAR model_name "churn | recommender"
        VARCHAR model_version
        VARCHAR metric "accuracy, roc_auc, precision_at_k..."
        DECIMAL value
    }
```

**What happens on delete:**
- Deleting a user removes their devices, wishlist, cart, predictions and offers (`CASCADE`).
- A user who has orders **cannot** be deleted (`RESTRICT`), so receipts are never lost.
- Deleting an order removes its items and payments (`CASCADE`).
- If an offer or prediction is deleted, the rows that pointed at it keep living with `NULL` (`SET NULL`).

## 2. MongoDB collections

| Collection | Main fields | Notes |
|---|---|---|
| `products` | `_id`, `name`, `slug`, `category`, `collection`, `season`, `seasonalLine`, `basePrice` (Decimal128), `tags[]`, **`variants[]`** (`sku`, colour, stock), `abaya{}` or `perfume{}`, `ratings{average,count}` | Variants are **embedded**: always read with the product. |
| `categories` | `slug`, `name`, `displayOrder` | abaya, perfume, handbag, bracelet, shayla, shoes, accessory |
| `collections` | `slug`, `name`, `tagline`, `palette[]`, `lines[]` | 4 collections: Seasonal (Desert Bloom, Velvet Moon, Amber Luxe, Floral Grace), Modern Muse, Traditions Reimagined, Simplicity Speaks |
| `reviews` | `productId`, `userId`, `rating` 1–5, `comment`, `verifiedPurchase` | **Referenced**, not embedded: reviews grow without limit. One per user per product. |
| `clickstream_events` | `userId`, `sessionId`, `type` (VIEW, SEARCH, ADD_TO_CART, …), `productId`, `device`, `timestamp` | The AI's training data (churn + recommender). |
| `brand_models` | `slug`, `name` | Empty for now. |

Each collection has a `$jsonSchema` validator (`database/mongodb/schemas/`) that rejects bad documents.

## 3. Links between the two databases

```mermaid
flowchart LR
    subgraph MySQL
        U[users.id]
        W[wishlist_items.product_id]
        C[cart_items.product_id + sku]
        OI[order_items.product_id + sku]
        O[orders.id]
    end
    subgraph MongoDB
        P[products._id / variants.sku]
        R[reviews.userId]
        CE[clickstream_events.userId / orderId / productId]
    end
    W -.-> P
    C -.-> P
    OI -.-> P
    R -.-> U
    CE -.-> U
    CE -.-> O
    CE -.-> P
```

- MySQL stores a product's MongoDB `_id` as `CHAR(24)` (for example `6750a1000000000000000101`).
- MongoDB stores a MySQL `users.id` or `orders.id` as a number.
- **There is no foreign key across the two databases.** Each database only polices its own rows. The **Java backend** checks the links instead: before adding to the cart or placing an order, it confirms in MongoDB that the product and SKU exist and are in stock.
- `order_items` copies the product's name, category and price at purchase time (a **snapshot**). A receipt stays correct even if the product is later renamed, repriced or removed.
