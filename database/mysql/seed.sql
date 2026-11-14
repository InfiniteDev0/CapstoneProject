-- =============================================================================
--  LuxuryShop: MySQL sample data
-- =============================================================================
--  A small, hand-made starter set: 1 admin, 2 customers, their devices, a few
--  wishlist and bag rows, and 5 sample orders on real products in MongoDB.
--  The big fake dataset (hundreds of customers and orders) comes in Phase 5.
--
--  Run AFTER schema.sql:  mysql -u luxury_app -p luxuryshop < database/mysql/seed.sql
--
--  Passwords are stored as BCrypt hashes only. The plain demo passwords are in
--  database/README.md for the examiner, not here.
--
--  product_id values are the fixed MongoDB _ids from database/mongodb/seed.js,
--  and each sku is one of that product's colour variants.
-- =============================================================================

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- Users
-- -----------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role, phone, country, city, gender, date_of_birth,
                   preferred_categories, created_at, last_login_at) VALUES
  (1, 'LuxuryShop Admin', 'admin@luxuryshop.local',
      '$2a$10$c9XDv/n1akc7VzMt7VK0seDBJaIB0HBUz.WGM4o7KdMXv6663QhbW', 'ADMIN',
      NULL, 'United Arab Emirates', 'Dubai', NULL, NULL,
      NULL, '2025-01-05 09:00:00', '2026-11-12 08:30:00'),
  (2, 'Amira Hassan', 'amira@luxuryshop.local',
      '$2a$10$cuxYHKxhSRlIeyZzNmWEmuGnVs8mORRQMF49RkPXZzpo5/KlqJ9By', 'CUSTOMER',
      '+971500000001', 'United Arab Emirates', 'Abu Dhabi', 'FEMALE', '1996-04-18',
      JSON_ARRAY('women', 'shoes'), '2025-03-14 18:22:00', '2026-11-12 09:25:00'),
  (3, 'Layla Mohamed', 'layla@luxuryshop.local',
      '$2a$10$A2obd6konD1C2mIfEUjNauqHcVqjzTERdAVD01WE1u7iCJy7UsosK', 'CUSTOMER',
      '+254700000002', 'Kenya', 'Nairobi', 'FEMALE', '2001-09-02',
      JSON_ARRAY('women'), '2026-02-01 11:40:00', '2026-10-05 21:10:00');

-- -----------------------------------------------------------------------------
-- Devices (Amira uses a phone and a laptop; Layla only a phone)
-- -----------------------------------------------------------------------------
INSERT INTO user_devices (user_id, device_id, device_type, os, browser, first_seen, last_seen) VALUES
  (2, 'dev-amira-iphone',  'MOBILE',  'iOS',     'Safari', '2025-03-14 18:22:00', '2026-11-12 09:25:00'),
  (2, 'dev-amira-macbook', 'DESKTOP', 'macOS',   'Chrome', '2025-06-02 10:15:00', '2026-11-02 10:12:00'),
  (3, 'dev-layla-android', 'MOBILE',  'Android', 'Chrome', '2026-02-01 11:40:00', '2026-10-05 21:10:00');

-- -----------------------------------------------------------------------------
-- Wishlist and bag
-- -----------------------------------------------------------------------------
INSERT INTO wishlist_items (user_id, product_id) VALUES
  (2, '6750a1000000000000000216'),  -- Women's Belted Wool Coat
  (2, '6750a1000000000000000221'),  -- Women's Longline Down Coat
  (3, '6750a1000000000000000215');  -- Women's Cropped Puffer Jacket

INSERT INTO cart_items (user_id, product_id, sku, quantity, selected_size) VALUES
  (3, '6750a1000000000000000312', 'LS-S-LIF-12-CHA', 1, '7');  -- Heritage Leather Sneaker, Chalk White

-- -----------------------------------------------------------------------------
-- Sample orders. order_items copy the name, category and price from MongoDB at
-- purchase time. Free shipping from $75, so every sample ships free.
-- -----------------------------------------------------------------------------
INSERT INTO orders (id, order_number, user_id, status, subtotal, discount_amount, shipping_fee, total,
                    currency, shipping_name, shipping_address, shipping_city, shipping_country,
                    device_type, created_at) VALUES
  (1, 'LS-2026-000001', 2, 'DELIVERED', 605.00, 0.00, 0.00, 605.00,
      'USD', 'Amira Hassan', 'Al Reem Island, Tower 3', 'Abu Dhabi', 'United Arab Emirates', 'MOBILE', '2026-09-18 19:52:00'),
  (2, 'LS-2026-000002', 2, 'SHIPPED', 690.00, 0.00, 0.00, 690.00,
      'USD', 'Amira Hassan', 'Al Reem Island, Tower 3', 'Abu Dhabi', 'United Arab Emirates', 'DESKTOP', '2026-11-02 10:12:00'),
  (3, 'LS-2026-000003', 3, 'DELIVERED', 525.00, 0.00, 0.00, 525.00,
      'USD', 'Layla Mohamed', 'Kilimani, Argwings Kodhek Rd', 'Nairobi', 'Kenya', 'MOBILE', '2026-08-15 13:05:00'),
  (4, 'LS-2026-000004', 3, 'CANCELLED', 1190.00, 0.00, 0.00, 1190.00,
      'USD', 'Layla Mohamed', 'Kilimani, Argwings Kodhek Rd', 'Nairobi', 'Kenya', 'MOBILE', '2026-10-05 21:10:00'),
  (5, 'LS-2026-000005', 2, 'PAID', 260.00, 0.00, 0.00, 260.00,
      'USD', 'Amira Hassan', 'Al Reem Island, Tower 3', 'Abu Dhabi', 'United Arab Emirates', 'MOBILE', '2026-11-12 09:25:00');

INSERT INTO order_items (order_id, product_id, sku, product_name, category, sub_category, color_name,
                         unit_price, quantity, selected_size) VALUES
  (1, '6750a1000000000000000208', 'LS-W-BOT-08-ONY', 'Women''s Sculpt Seamless Legging', 'women', 'bottomwear', 'Onyx', 185.00, 1, 'M'),
  (1, '6750a1000000000000000301', 'LS-S-RUN-01-ONY', 'Stratus Runner',                   'shoes', 'running',    'Onyx', 420.00, 1, '8'),
  (2, '6750a1000000000000000215', 'LS-W-OUT-15-ONY', 'Women''s Cropped Puffer Jacket',   'women', 'outerwear',  'Onyx', 690.00, 1, 'S'),
  (3, '6750a1000000000000000202', 'LS-W-TOP-02-IVO', 'Women''s Silk Jersey Tee',         'women', 'topwear',    'Ivory', 135.00, 1, 'M'),
  (3, '6750a1000000000000000228', 'LS-W-ACC-28-ONY', 'Women''s Leather Belt Bag',        'women', 'accessories','Onyx', 390.00, 1, 'ONE_SIZE'),
  (4, '6750a1000000000000000216', 'LS-W-OUT-16-CAM', 'Women''s Belted Wool Coat',        'women', 'outerwear',  'Camel', 1190.00, 1, 'M'),
  (5, '6750a1000000000000000124', 'LS-M-ACC-24-CHA', 'Men''s Cashmere Scarf',            'men',   'accessories','Charcoal', 260.00, 1, 'ONE_SIZE');

INSERT INTO payments (order_id, amount, currency, method, status, reference, card_last4, paid_at) VALUES
  (1,  605.00, 'USD', 'CARD', 'SUCCEEDED', 'SIM-TXN-20260918-0001', '4242', '2026-09-18 19:52:05'),
  (2,  690.00, 'USD', 'CARD', 'SUCCEEDED', 'SIM-TXN-20261102-0002', '4242', '2026-11-02 10:12:05'),
  (3,  525.00, 'USD', 'CARD', 'SUCCEEDED', 'SIM-TXN-20260815-0003', '1881', '2026-08-15 13:05:05'),
  (4, 1190.00, 'USD', 'CARD', 'REFUNDED',  'SIM-TXN-20261005-0004', '1881', '2026-10-05 21:10:05'),
  (5,  260.00, 'USD', 'CARD', 'SUCCEEDED', 'SIM-TXN-20261112-0005', '4242', '2026-11-12 09:25:05');
