"""
Puts the practice data into the databases, and takes it out again.

wipe() removes ONLY generated data. A row counts as generated when BOTH are true:
  * the user id is >= FIRST_USER_ID (1001), and
  * the email ends in @example.com / .org / .net
So the admin, the 3 test users, real sign-ups and their orders are never touched,
and neither are the products.
"""
from datetime import datetime

import bcrypt

from . import config
from .simulate import order_totals

GENERATED_USERS_SQL = (
    "SELECT id FROM users WHERE id >= %s AND (email LIKE '%%@example.com' OR email LIKE '%%@example.org' "
    "OR email LIKE '%%@example.net')"
)


def generated_user_ids(cur) -> list[int]:
    cur.execute(GENERATED_USERS_SQL, (config.FIRST_USER_ID,))
    return [r[0] for r in cur.fetchall()]


def wipe(conn, mdb) -> dict:
    with conn.cursor() as cur:
        ids = generated_user_ids(cur)
        removed = {"customers": len(ids), "orders": 0}
        if ids:
            marks = ",".join(["%s"] * len(ids))
            removed["orders"] = cur.execute(f"DELETE FROM orders WHERE user_id IN ({marks})", ids)  # lines + payments cascade
            cur.execute(f"DELETE FROM users WHERE id IN ({marks})", ids)  # devices, wishlist, bag, predictions cascade
        # next ids continue right after what's left
        for table in ("orders", "users", "order_items", "payments", "user_devices", "wishlist_items", "cart_items"):
            cur.execute(f"SELECT COALESCE(MAX(id), 0) + 1 FROM {table}")
            cur.execute(f"ALTER TABLE {table} AUTO_INCREMENT = {max(cur.fetchone()[0], 1)}")
    conn.commit()
    # every generated click has a "gen-" session id; real visits use "web-" or the shop's own ids
    removed["events"] = mdb.clickstream_events.delete_many(
        {"sessionId": {"$regex": f"^{config.SESSION_PREFIX}"}}).deleted_count
    removed["reviews"] = mdb.reviews.delete_many({"userId": {"$in": ids}}).deleted_count if ids else 0
    refresh_ratings(mdb)
    return removed


def refresh_ratings(mdb):
    """Each product's star summary = the average of its reviews (0 when it has none)."""
    summary = {s["_id"]: s for s in mdb.reviews.aggregate(
        [{"$group": {"_id": "$productId", "avg": {"$avg": "$rating"}, "n": {"$sum": 1}}}])}
    for p in mdb.products.find({}, {"_id": 1}):
        s = summary.get(p["_id"])
        mdb.products.update_one({"_id": p["_id"]}, {"$set": {"ratings": {
            "average": round(s["avg"], 1) if s else 0.0, "count": s["n"] if s else 0}}})


def write(conn, mdb, customers, world, password: str, end: datetime) -> None:
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=10, prefix=b"2a")).decode()
    with conn.cursor() as cur:
        # ---- customers -----------------------------------------------------------------
        cur.executemany(
            "INSERT INTO users (id, name, email, password_hash, role, phone, country, city, gender, date_of_birth, "
            "preferred_categories, is_active, created_at, updated_at, last_login_at) "
            "VALUES (%s,%s,%s,%s,'CUSTOMER',%s,%s,%s,%s,%s,%s,TRUE,%s,%s,%s)",
            [(c.id, c.name, c.email, hashed, c.phone, c.country, c.city, c.gender, c.dob,
              None if c.preferred is None else '["' + '","'.join(c.preferred) + '"]',
              c.signup, c.signup, world.last_login.get(c.id, c.signup)) for c in customers])

        cur.executemany(
            "INSERT INTO user_devices (user_id, device_id, device_type, os, browser, first_seen, last_seen) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s)",
            [(c.id, d.device_id, d.type, d.os, d.browser, *world.device_seen[d.device_id])
             for c in customers for d in c.devices if d.device_id in world.device_seen])

        # ---- orders (ids in date order, so order numbers read like a real shop's) -----
        cur.execute("SELECT COALESCE(MAX(id), 0) FROM orders")
        next_id = int(cur.fetchone()[0]) + 1
        world.orders.sort(key=lambda o: o.created)
        order_rows, line_rows, pay_rows = [], [], []
        for o in world.orders:
            o.id = next_id
            next_id += 1
            for e in o.events:
                e["orderId"] = o.id
            subtotal, shipping, total = order_totals(o)
            c = o.user
            order_rows.append((o.id, f"LS-{o.created.year}-{o.id:06d}", c.id, o.status, subtotal, shipping, total,
                               c.name, f"{int(o.id % 97) + 3} {c.city} Road", c.city, c.country, o.device,
                               o.created, o.created))
            for p, v, size, qty in o.lines:
                line_rows.append((o.id, p.id, v.sku, p.name, p.category, p.sub, v.color, v.price, qty, size))
            refunded = o.status in ("CANCELLED", "REFUNDED")
            pay_rows.append((o.id, total, o.method, "REFUNDED" if refunded else "SUCCEEDED",
                             f"SIM-TXN-{o.created:%Y%m%d}-{o.id:06d}", o.last4, o.created, o.created))
        cur.executemany(
            "INSERT INTO orders (id, order_number, user_id, status, subtotal, discount_amount, shipping_fee, total, "
            "currency, shipping_name, shipping_address, shipping_city, shipping_country, device_type, created_at, updated_at) "
            "VALUES (%s,%s,%s,%s,%s,0.00,%s,%s,'USD',%s,%s,%s,%s,%s,%s,%s)", order_rows)
        cur.executemany(
            "INSERT INTO order_items (order_id, product_id, sku, product_name, category, sub_category, color_name, "
            "unit_price, quantity, selected_size) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", line_rows)
        cur.executemany(
            "INSERT INTO payments (order_id, amount, currency, method, status, reference, card_last4, paid_at, created_at) "
            "VALUES (%s,%s,'USD',%s,%s,%s,%s,%s,%s)", pay_rows)

        # ---- wishlists and open bags -------------------------------------------------
        cur.executemany("INSERT INTO wishlist_items (user_id, product_id, created_at) VALUES (%s,%s,%s)",
                        [(u, pid, when) for (u, pid), when in world.wishlists.items()])
        bag_rows = {}
        for u, lines in world.carts.items():
            for p, v, size, qty, when in lines:
                bag_rows[(u, v.sku, size)] = (u, p.id, v.sku, qty, size, when, when)
        cur.executemany("INSERT INTO cart_items (user_id, product_id, sku, quantity, selected_size, created_at, updated_at) "
                        "VALUES (%s,%s,%s,%s,%s,%s,%s)", list(bag_rows.values()))
    conn.commit()

    # ---- MongoDB: clicks and reviews ------------------------------------------------------
    for i in range(0, len(world.events), 5000):
        mdb.clickstream_events.insert_many(world.events[i:i + 5000], ordered=False)
    if world.reviews:
        mdb.reviews.insert_many(world.reviews, ordered=False)
    refresh_ratings(mdb)
