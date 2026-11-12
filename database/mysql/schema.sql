-- =============================================================================
--  Vela Noire: MySQL schema (the "receipt book")
-- =============================================================================
--  MySQL holds the strict, money-and-people data: accounts, carts, orders,
--  payments, and the churn/AI results the admin portal reads.
--  Products, reviews and clicks live in MongoDB (the "menu album").
--
--  Links to MongoDB: columns named `product_id` hold a MongoDB ObjectId as
--  24 hex characters. MySQL cannot check them (no foreign key can cross two
--  databases), so the Java API checks that the product exists before saving.
--
--  Run:  mysql -u vela_app -p vela_noire < database/mysql/schema.sql
--  ⚠ Running this file RESETS the database: it drops and recreates every table.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS model_metrics, payments, order_items, orders, retention_offers,
  churn_predictions, cart_items, wishlist_items, user_devices, users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- users: everyone who can log in, customers and admins.
-- created_at is the customer's "tenure" (how long they have been with us);
-- last_login_at feeds the churn model ("days since last visit").
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id                   BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name                 VARCHAR(120)     NOT NULL,
  email                VARCHAR(255)     NOT NULL,
  password_hash        CHAR(60)         NOT NULL COMMENT 'BCrypt hash, never the plain password',
  role                 ENUM('CUSTOMER','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  phone                VARCHAR(30)      NULL,
  country              VARCHAR(60)      NULL,
  city                 VARCHAR(80)      NULL,
  gender               ENUM('FEMALE','MALE','OTHER','PREFER_NOT_TO_SAY') NULL,
  date_of_birth        DATE             NULL,
  preferred_categories JSON             NULL COMMENT 'Category slugs, e.g. ["abaya","perfume"]',
  is_active            BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at           DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  last_login_at        DATETIME(3)      NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_role (role),
  KEY ix_users_last_login (last_login_at),
  CONSTRAINT ck_users_pref_json CHECK (preferred_categories IS NULL OR JSON_TYPE(preferred_categories) = 'ARRAY')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Customer and admin accounts';

-- -----------------------------------------------------------------------------
-- user_devices: each phone, tablet or computer a customer has used.
-- The spec asks for "total devices registered"; the churn model uses it too.
-- device_id is a random id the browser keeps, so the same laptop is one row.
-- -----------------------------------------------------------------------------
CREATE TABLE user_devices (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  device_id    VARCHAR(64)     NOT NULL,
  device_type  ENUM('DESKTOP','MOBILE','TABLET') NOT NULL,
  os           VARCHAR(40)     NULL,
  browser      VARCHAR(40)     NULL,
  first_seen   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_devices_user_device (user_id, device_id),
  CONSTRAINT fk_devices_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Devices each customer has used';

-- -----------------------------------------------------------------------------
-- wishlist_items: products a customer has hearted.
-- -----------------------------------------------------------------------------
CREATE TABLE wishlist_items (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  product_id  CHAR(24)        NOT NULL COMMENT 'MongoDB products._id',
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
  KEY ix_wishlist_product (product_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Saved-for-later products';

-- -----------------------------------------------------------------------------
-- cart_items: what is in each customer's shopping bag right now.
-- One row per colour (sku) and size; adding the same again raises quantity.
-- Abaya options (size, front style, shayla) are chosen at add-to-cart time.
-- -----------------------------------------------------------------------------
CREATE TABLE cart_items (
  id                       BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id                  BIGINT UNSIGNED  NOT NULL,
  product_id               CHAR(24)         NOT NULL COMMENT 'MongoDB products._id',
  sku                      VARCHAR(40)      NOT NULL COMMENT 'MongoDB products.variants.sku (the colour)',
  quantity                 INT UNSIGNED     NOT NULL DEFAULT 1,
  selected_size            VARCHAR(10)      NOT NULL DEFAULT 'ONE_SIZE',
  selected_style           ENUM('OPEN_FRONT','CLOSED_FRONT','HALF_CLOSED','COMPLETELY_CLOSED') NULL,
  shayla_type              ENUM('STANDARD','CUSTOM','NONE') NULL,
  custom_measurements_url  VARCHAR(500)     NULL,
  comments                 VARCHAR(500)     NULL,
  created_at               DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at               DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_user_sku_size (user_id, sku, selected_size),
  KEY ix_cart_product (product_id),
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT ck_cart_qty CHECK (quantity BETWEEN 1 AND 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Shopping bag contents';

-- -----------------------------------------------------------------------------
-- churn_predictions: the smart waiter's guess that a customer will stop coming.
-- One row per prediction run, so we keep the history (risk going up or down).
-- -----------------------------------------------------------------------------
CREATE TABLE churn_predictions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  probability    DECIMAL(5,4)    NOT NULL COMMENT '0.0000 to 1.0000',
  risk_level     ENUM('HIGH','MEDIUM','LOW') NOT NULL,
  top_factors    JSON            NULL COMMENT 'Why, e.g. ["days_since_last_order","fewer_sessions"]',
  model_version  VARCHAR(40)     NOT NULL,
  predicted_at   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_churn_user_time (user_id, predicted_at),
  KEY ix_churn_risk_time (risk_level, predicted_at),
  CONSTRAINT fk_churn_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT ck_churn_prob CHECK (probability BETWEEN 0 AND 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Churn model results per customer';

-- -----------------------------------------------------------------------------
-- retention_offers: discount codes an admin sends to at-risk customers.
-- Linking the offer to the prediction (and later to the order that used it)
-- lets us measure whether discounts actually win customers back.
-- -----------------------------------------------------------------------------
CREATE TABLE retention_offers (
  id                   BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id              BIGINT UNSIGNED  NOT NULL COMMENT 'Customer who receives the offer',
  churn_prediction_id  BIGINT UNSIGNED  NULL COMMENT 'The prediction that triggered it',
  sent_by              BIGINT UNSIGNED  NULL COMMENT 'Admin who sent it',
  code                 VARCHAR(32)      NOT NULL,
  percent_off          TINYINT UNSIGNED NOT NULL,
  status               ENUM('SENT','REDEEMED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'SENT',
  message              VARCHAR(255)     NULL,
  sent_at              DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at           DATETIME(3)      NULL,
  redeemed_at          DATETIME(3)      NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_offers_code (code),
  KEY ix_offers_user_status (user_id, status),
  CONSTRAINT fk_offers_user       FOREIGN KEY (user_id)             REFERENCES users (id)             ON DELETE CASCADE,
  CONSTRAINT fk_offers_prediction FOREIGN KEY (churn_prediction_id) REFERENCES churn_predictions (id) ON DELETE SET NULL,
  CONSTRAINT fk_offers_admin      FOREIGN KEY (sent_by)             REFERENCES users (id)             ON DELETE SET NULL,
  CONSTRAINT ck_offers_percent CHECK (percent_off BETWEEN 1 AND 90)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Win-back discounts for at-risk customers';

-- -----------------------------------------------------------------------------
-- orders: one row per checkout. Money is DECIMAL (exact), never FLOAT.
-- user_id is RESTRICT: we never delete a customer who has receipts.
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number        VARCHAR(20)     NOT NULL COMMENT 'Shown to the customer, e.g. VN-2026-000001',
  user_id             BIGINT UNSIGNED NOT NULL,
  status              ENUM('PENDING','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  subtotal            DECIMAL(10,2)   NOT NULL,
  discount_amount     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  shipping_fee        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  total               DECIMAL(10,2)   NOT NULL,
  currency            CHAR(3)         NOT NULL DEFAULT 'USD',
  retention_offer_id  BIGINT UNSIGNED NULL COMMENT 'Discount code used, if any',
  shipping_name       VARCHAR(120)    NULL,
  shipping_address    VARCHAR(255)    NULL,
  shipping_city       VARCHAR(80)     NULL,
  shipping_country    VARCHAR(60)     NOT NULL,
  device_type         ENUM('DESKTOP','MOBILE','TABLET') NULL COMMENT 'Device used to check out',
  created_at          DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_number (order_number),
  KEY ix_orders_user_time (user_id, created_at),
  KEY ix_orders_status (status),
  KEY ix_orders_created (created_at),
  CONSTRAINT fk_orders_user  FOREIGN KEY (user_id)            REFERENCES users (id)            ON DELETE RESTRICT,
  CONSTRAINT fk_orders_offer FOREIGN KEY (retention_offer_id) REFERENCES retention_offers (id) ON DELETE SET NULL,
  CONSTRAINT ck_orders_money CHECK (subtotal >= 0 AND discount_amount >= 0 AND shipping_fee >= 0 AND total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Checkouts (the receipts)';

-- -----------------------------------------------------------------------------
-- order_items: the lines on a receipt. A SNAPSHOT: name, category and price are
-- copied at purchase time, so the receipt stays true even if the product is
-- renamed, repriced or deleted in MongoDB later.
-- -----------------------------------------------------------------------------
CREATE TABLE order_items (
  id                       BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  order_id                 BIGINT UNSIGNED  NOT NULL,
  product_id               CHAR(24)         NOT NULL COMMENT 'MongoDB products._id',
  sku                      VARCHAR(40)      NOT NULL COMMENT 'MongoDB products.variants.sku',
  product_name             VARCHAR(200)     NOT NULL,
  category                 VARCHAR(40)      NOT NULL COMMENT 'Category slug, e.g. abaya',
  collection               VARCHAR(80)      NULL,
  color_name               VARCHAR(60)      NULL,
  unit_price               DECIMAL(10,2)    NOT NULL,
  quantity                 INT UNSIGNED     NOT NULL,
  line_total               DECIMAL(10,2)    AS (unit_price * quantity) STORED,
  selected_size            VARCHAR(10)      NOT NULL DEFAULT 'ONE_SIZE',
  selected_style           ENUM('OPEN_FRONT','CLOSED_FRONT','HALF_CLOSED','COMPLETELY_CLOSED') NULL,
  shayla_type              ENUM('STANDARD','CUSTOM','NONE') NULL,
  custom_measurements_url  VARCHAR(500)     NULL,
  comments                 VARCHAR(500)     NULL,
  PRIMARY KEY (id),
  KEY ix_items_order (order_id),
  KEY ix_items_product (product_id),
  KEY ix_items_category (category),
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT ck_items_qty CHECK (quantity >= 1),
  CONSTRAINT ck_items_price CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Lines on each receipt (price snapshot)';

-- -----------------------------------------------------------------------------
-- payments: the (simulated) transaction for each order. Checkout is not real,
-- but we record it like a real one: amount, method, status, a reference.
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id    BIGINT UNSIGNED NOT NULL,
  amount      DECIMAL(10,2)   NOT NULL,
  currency    CHAR(3)         NOT NULL DEFAULT 'USD',
  method      ENUM('CARD','MOBILE_MONEY','PAYPAL','CASH_ON_DELIVERY') NOT NULL,
  status      ENUM('PENDING','SUCCEEDED','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  reference   VARCHAR(64)     NOT NULL COMMENT 'Simulated transaction id',
  card_last4  CHAR(4)         NULL,
  paid_at     DATETIME(3)     NULL,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_reference (reference),
  KEY ix_payments_order (order_id),
  KEY ix_payments_status (status),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT ck_payments_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Simulated payment transactions';

-- -----------------------------------------------------------------------------
-- model_metrics: how good the AI models are, for the admin "Model Health" page.
-- e.g. (churn, v1, roc_auc, 0.8731) or (recommender, v1, precision_at_10, 0.21).
-- -----------------------------------------------------------------------------
CREATE TABLE model_metrics (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  model_name     VARCHAR(40)     NOT NULL COMMENT 'churn | recommender',
  model_version  VARCHAR(40)     NOT NULL,
  metric         VARCHAR(40)     NOT NULL COMMENT 'accuracy, precision, recall, roc_auc, precision_at_k, rmse',
  value          DECIMAL(10,6)   NOT NULL,
  recorded_at    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_metrics_model_version_metric (model_name, model_version, metric),
  KEY ix_metrics_model_time (model_name, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='AI model evaluation scores';
