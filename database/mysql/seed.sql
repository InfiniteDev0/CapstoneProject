-- =============================================================================
--  Vela Noire: MySQL sample data
-- =============================================================================
--  A small, hand-made starter set: 1 admin, 2 customers, their devices, and one
--  sample order that points at real products in MongoDB.
--  The big fake dataset (hundreds of customers and orders) comes in Phase 5.
--
--  Run AFTER schema.sql:  mysql -u vela_app -p vela_noire < database/mysql/seed.sql
--
--  Passwords are stored as BCrypt hashes only. The plain demo passwords are in
--  database/README.md for the examiner, not here.
--
--  product_id values are the fixed MongoDB _ids from database/mongodb/seed.js.
-- =============================================================================

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- Users
-- -----------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role, phone, country, city, gender, date_of_birth,
                   preferred_categories, created_at, last_login_at) VALUES
  (1, 'Vela Noire Admin', 'admin@velanoire.local',
      '$2a$10$QyWQ6LENX8Oy9TGyn4YUu.hcyUiBUGmzzJhzrVqOz0dYwE/PVRaCq', 'ADMIN',
      NULL, 'United Arab Emirates', 'Dubai', NULL, NULL,
      NULL, '2025-01-05 09:00:00', '2026-11-10 08:30:00'),
  (2, 'Amira Hassan', 'amira@example.com',
      '$2a$10$UbpQj16Sh4dnd1yFEJHcXerg0nx9MDmLMLrdcmq/zjKTdA7Rzf3B2', 'CUSTOMER',
      '+971500000001', 'United Arab Emirates', 'Abu Dhabi', 'FEMALE', '1996-04-18',
      JSON_ARRAY('abaya', 'perfume'), '2025-03-14 18:22:00', '2026-11-09 21:05:00'),
  (3, 'Layla Mohamed', 'layla@example.com',
      '$2a$10$G8Y4uPmr9auFfF8Zmq4od.aEwSCAEiA9gA2sxcAL9l6/5M1t/bX8a', 'CUSTOMER',
      '+254700000002', 'Kenya', 'Nairobi', 'FEMALE', '2001-09-02',
      JSON_ARRAY('handbag', 'shayla', 'bracelet'), '2026-02-01 11:40:00', '2026-08-15 13:10:00');

-- -----------------------------------------------------------------------------
-- Devices (Amira uses a phone and a laptop; Layla only a phone)
-- -----------------------------------------------------------------------------
INSERT INTO user_devices (user_id, device_id, device_type, os, browser, first_seen, last_seen) VALUES
  (2, 'dev-amira-iphone',  'MOBILE',  'iOS',     'Safari', '2025-03-14 18:22:00', '2026-11-09 21:05:00'),
  (2, 'dev-amira-macbook', 'DESKTOP', 'macOS',   'Chrome', '2025-06-02 10:15:00', '2026-10-28 09:40:00'),
  (3, 'dev-layla-android', 'MOBILE',  'Android', 'Chrome', '2026-02-01 11:40:00', '2026-08-15 13:10:00');

-- -----------------------------------------------------------------------------
-- Wishlist and cart
-- -----------------------------------------------------------------------------
INSERT INTO wishlist_items (user_id, product_id) VALUES
  (2, '6750a1000000000000000105'),  -- Malikat Al-Layl Abaya (Velvet Moon)
  (3, '6750a1000000000000000103');  -- Velvet Moon Mini Bag

INSERT INTO cart_items (user_id, product_id, sku, quantity, selected_size) VALUES
  (3, '6750a1000000000000000704', 'VN-BAG-SIM-01-TAU', 1, 'ONE_SIZE');  -- Sukun Matte Tote

-- -----------------------------------------------------------------------------
-- One sample order: Amira buys the Velvet Moon winter set (abaya + Ruqayyah).
-- order_items copy the name, category and price from MongoDB at purchase time.
-- -----------------------------------------------------------------------------
INSERT INTO orders (id, order_number, user_id, status, subtotal, discount_amount, shipping_fee, total,
                    currency, shipping_name, shipping_address, shipping_city, shipping_country,
                    device_type, created_at) VALUES
  (1, 'VN-2026-000001', 2, 'DELIVERED', 200.00, 0.00, 0.00, 200.00,
      'USD', 'Amira Hassan', 'Al Reem Island, Tower 3', 'Abu Dhabi', 'United Arab Emirates',
      'MOBILE', '2026-10-02 20:14:00');

INSERT INTO order_items (order_id, product_id, sku, product_name, category, collection, color_name,
                         unit_price, quantity, selected_size, selected_style, shayla_type) VALUES
  (1, '6750a1000000000000000101', 'VN-ABY-VM-01-PLM', 'Velvet Moon Abaya', 'abaya', 'Seasonal: Velvet Moon',
      'Midnight Plum', 145.00, 1, 'M', 'OPEN_FRONT', 'STANDARD'),
  (1, '6750a1000000000000000102', 'VN-PRF-VM-02-50', 'Ruqayyah Eau de Parfum', 'perfume', 'Seasonal: Velvet Moon',
      NULL, 55.00, 1, 'ONE_SIZE', NULL, NULL);

INSERT INTO payments (order_id, amount, currency, method, status, reference, card_last4, paid_at) VALUES
  (1, 200.00, 'USD', 'CARD', 'SUCCEEDED', 'SIM-TXN-20261002-0001', '4242', '2026-10-02 20:14:05');
