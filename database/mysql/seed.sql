-- =============================================================================
--  LuxuryShop: MySQL sample data
-- =============================================================================
--  A small, hand-made starter set: 1 admin, 2 customers, their devices and a few
--  wishlist and bag rows. No sample orders.
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

-- No sample orders: orders come from real checkouts (and, in Phase 5, the practice data).
