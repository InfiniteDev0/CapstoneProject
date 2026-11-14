"""
A year in the life of every practice customer.

Each day we roll a dice: does this customer visit today? (busier customers roll more
often; faders roll less and less as they drift away, and stop after the cut-off).
A visit is a "session": maybe a search, then a few product views chosen by taste,
maybe a like, maybe something in the bag, and sometimes an order.

Everything is written the same way the real app writes it: clicks for MongoDB,
orders / payments / wishlists / bags for MySQL.
"""
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from decimal import Decimal

import numpy as np
from bson import ObjectId

from . import config
from .personas import TASTES

PAGE_HOURS = np.array([0.5, 0.3, 0.2, 0.2, 0.3, 0.6, 1.2, 2.0, 2.4, 2.4, 2.5, 2.8, 3.4, 3.4, 2.8, 2.6, 2.8, 3.2,
                       4.2, 5.2, 5.6, 5.0, 3.6, 1.6])  # local hour of day people shop (evenings are busiest)
PAGE_HOURS = PAGE_HOURS / PAGE_HOURS.sum()

REVIEW_TEXT = {
    5: [("Worth every penny", "Beautiful quality and the fit is perfect."), ("Love it", "Feels even better than it looks."),
        ("My new favourite", "I wear it all the time. Already want another colour."), ("Stunning", "Luxury you can feel.")],
    4: [("Really good", "Great quality, runs slightly big."), ("Very happy", "Lovely piece, delivery was quick."),
        ("Great fit", "Comfortable and well made.")],
    3: [("It's okay", "Nice but not quite what I expected."), ("Decent", "Good quality, a bit pricey for what it is.")],
    2: [("Not for me", "The fit didn't work for me."), ("Disappointed", "Expected more at this price.")],
    1: [("Sent it back", "Didn't match the photos at all.")],
}


@dataclass
class Order:
    user: object
    created: datetime
    device: str
    lines: list                     # (product, variant, size, qty)
    id: int | None = None
    status: str = "PAID"
    method: str = "CARD"
    last4: str | None = None
    events: list = field(default_factory=list)   # PURCHASE events waiting for the real order id


@dataclass
class World:
    events: list = field(default_factory=list)
    orders: list = field(default_factory=list)
    wishlists: dict = field(default_factory=dict)     # (user_id, product_id) -> datetime
    carts: dict = field(default_factory=dict)         # user_id -> [(product, variant, size, qty, when)]
    reviews: list = field(default_factory=list)
    last_login: dict = field(default_factory=dict)    # user_id -> datetime
    device_seen: dict = field(default_factory=dict)   # device_id -> [first, last]


def product_weights(c, products, price_z) -> np.ndarray:
    """How likely this customer is to look at each product (taste, gender, price appetite)."""
    likes = TASTES[c.persona.taste]["likes"]
    likes2 = TASTES[c.persona.taste2]["likes"] if c.persona.taste2 else (lambda p: False)
    w = np.ones(len(products))
    for i, p in enumerate(products):
        if likes(p):
            w[i] += 9
        if likes2(p):
            w[i] += 4
        if (p.category == "women" and c.gender == "MALE") or (p.category == "men" and c.gender == "FEMALE"):
            w[i] *= 0.12   # the odd gift for someone else
    w *= np.exp(0.6 * c.params["price"] * price_z)
    return w / w.sum()


def activity(c, day: date, cutoff: date) -> float:
    """How lively this customer is on a given day (1 = normal)."""
    m = 1.0
    if (day - c.signup.date()).days < 14:
        m *= 1.6                                   # excited new customer
    if day.month in (11, 12):
        m *= 1.25                                  # holiday shopping
    elif day.month == 1:
        m *= 0.8
    if c.persona.fader:
        if day >= cutoff:
            return 0.0                             # gone
        start = cutoff - timedelta(days=c.persona.fade_start_days_before_cutoff)
        if day >= start:
            left = (cutoff - day).days / max(1, (cutoff - start).days)
            m *= 0.06 + 0.94 * left                # slowly fading out
    return m


def pick_size(c, p, rng) -> str:
    if not p.sizes:
        return "ONE_SIZE"
    mine = c.shoe_size if p.category == "shoes" else c.apparel_size
    if mine in p.sizes and rng.random() < 0.9:
        return mine
    return str(rng.choice(p.sizes))


def pick_variant(p, rng):
    w = np.array([v.stock + 2.0 for v in p.variants])
    return p.variants[int(rng.choice(len(p.variants), p=w / w.sum()))]


def event(c, sid, typ, device, when, page, product=None, query=None):
    return {"userId": c.id, "sessionId": sid, "type": typ, "device": device, "timestamp": when,
            "productId": ObjectId(product.id) if product else None,
            "category": product.category if product else None, "query": query, "orderId": None, "page": page}


def simulate(customers, products, price_z, rng, today: date, cutoff: date, end: datetime) -> World:
    world = World()
    for c in customers:
        weights = product_weights(c, products, price_z)
        rate_per_day = c.params["visits"] / 7.0
        # signing up IS a visit: everyone looks around on their first day
        session_no = 1
        _session(c, f"{config.SESSION_PREFIX}{c.id}-1", c.signup, products, weights, rng, world, end)
        day = c.signup.date() + timedelta(days=1)
        while day <= end.date():
            if rng.random() < min(0.95, rate_per_day * activity(c, day, cutoff)):
                local_hour = float(rng.choice(24, p=PAGE_HOURS)) + float(rng.random())
                start = datetime(day.year, day.month, day.day) + timedelta(hours=local_hour - config.LOCAL_UTC_OFFSET_HOURS)
                if c.signup < start < end:
                    session_no += 1
                    _session(c, f"{config.SESSION_PREFIX}{c.id}-{session_no}", start, products, weights, rng, world, end)
            day += timedelta(days=1)
    _finish_orders(world, rng, end)
    _make_reviews(world, rng, end)
    return world


def _session(c, sid, t, products, weights, rng, world: World, end: datetime):
    device = c.devices[0] if len(c.devices) == 1 or rng.random() < 0.6 else c.devices[int(rng.integers(len(c.devices)))]
    seen = world.device_seen.setdefault(device.device_id, [t, t])
    seen[1] = t
    world.last_login[c.id] = t
    likes = TASTES[c.persona.taste]["likes"]

    if rng.random() < 0.3:                                   # starts with a search
        q = str(rng.choice(TASTES[c.persona.taste]["keywords"]))
        world.events.append(event(c, sid, "SEARCH", device.type, t, f"/search?q={q.replace(' ', '+')}", query=q))
        t += timedelta(seconds=float(rng.uniform(5, 30)))

    n_views = 1 + int(rng.poisson(3.2 if c.persona.segment != "big_spender" else 4.5))
    bag = []
    for idx in rng.choice(len(products), size=n_views, p=weights):
        p = products[int(idx)]
        world.events.append(event(c, sid, "VIEW", device.type, t, f"/product/{p.slug}", p))
        t += timedelta(seconds=float(rng.uniform(15, 140)))
        if rng.random() < 0.05 and (c.id, p.id) not in world.wishlists:
            world.wishlists[(c.id, p.id)] = t
            world.events.append(event(c, sid, "WISHLIST", device.type, t, f"/product/{p.slug}", p))
        cart_p = c.params["cart"] * (1.7 if likes(p) else 0.7)
        if len(bag) < c.params["max_items"] and rng.random() < cart_p:
            qty = 2 if c.persona.segment == "big_spender" and rng.random() < 0.15 else 1
            bag.append((p, pick_variant(p, rng), pick_size(c, p, rng), qty))
            world.events.append(event(c, sid, "ADD_TO_CART", device.type, t, f"/product/{p.slug}", p))
            t += timedelta(seconds=float(rng.uniform(5, 40)))

    for line in list(bag):                                    # second thoughts
        if rng.random() < 0.18:
            bag.remove(line)
            world.events.append(event(c, sid, "REMOVE_FROM_CART", device.type, t, "/cart", line[0]))
            t += timedelta(seconds=float(rng.uniform(5, 30)))

    if not bag or t >= end:
        return
    if rng.random() < c.params["buy"]:
        t += timedelta(seconds=float(rng.uniform(60, 300)))   # checkout takes a few minutes
        if t >= end:
            return
        order = Order(c, t, device.type, bag)
        purchase = event(c, sid, "PURCHASE", device.type, t, "/checkout")
        order.events.append(purchase)
        world.events.append(purchase)
        world.orders.append(order)
        world.carts.pop(c.id, None)
    else:
        # left in the bag; only bags from the last 10 days stay open
        world.carts[c.id] = [(p, v, s, q, t) for p, v, s, q in bag]


def _finish_orders(world: World, rng, end: datetime):
    """Order statuses follow the order's age; a few are cancelled or refunded. Payments too."""
    cutoff_open = end - timedelta(days=10)
    world.carts = {u: lines for u, lines in world.carts.items() if lines[-1][4] >= cutoff_open}
    for o in world.orders:
        age = (end - o.created).total_seconds() / 86400
        roll = rng.random()
        if age > 3 and roll < 0.04:
            o.status = "CANCELLED"
        elif age > 10 and roll < 0.06:
            o.status = "REFUNDED"
        elif age < 2:
            o.status = "PAID" if rng.random() < 0.6 else "PROCESSING"
        elif age < 7:
            o.status = "PROCESSING" if rng.random() < 0.3 else "SHIPPED"
        elif age < 14:
            o.status = "SHIPPED" if rng.random() < 0.4 else "DELIVERED"
        else:
            o.status = "DELIVERED"
        kenyan = o.user.country in ("Kenya", "Uganda", "Tanzania")
        o.method = str(rng.choice(["CARD", "MOBILE_MONEY", "PAYPAL"], p=[0.6, 0.35, 0.05] if kenyan else [0.88, 0.0, 0.12]))
        o.last4 = str(rng.choice(["4242", "1881", "0005", "4444", "1117", "8431", "5100"])) if o.method == "CARD" else None


def _make_reviews(world: World, rng, end: datetime):
    """About 1 in 5 delivered pieces gets a review; customers rate their favourite kind of piece higher."""
    done = set()
    for o in world.orders:
        if o.status != "DELIVERED":
            continue
        likes = TASTES[o.user.persona.taste]["likes"]
        for p, _v, _s, _q in o.lines:
            if (o.user.id, p.id) in done or rng.random() > 0.2:
                continue
            when = o.created + timedelta(days=float(rng.uniform(5, 20)))
            if when >= end:
                continue
            done.add((o.user.id, p.id))
            pool = [5, 5, 5, 4, 4, 3] if likes(p) else [5, 4, 4, 3, 3, 2, 1]
            rating = int(rng.choice(pool))
            title, comment = REVIEW_TEXT[rating][int(rng.integers(len(REVIEW_TEXT[rating])))]
            first, *rest = o.user.name.split(" ")
            world.reviews.append({"productId": ObjectId(p.id), "userId": o.user.id,
                                  "userName": f"{first} {rest[-1][0]}." if rest else first, "rating": rating,
                                  "title": title, "comment": comment, "verifiedPurchase": True, "createdAt": when})


def money(x) -> Decimal:
    return Decimal(x).quantize(Decimal("0.01"))


def order_totals(o: Order):
    subtotal = money(sum(v.price * q for _p, v, _s, q in o.lines))
    shipping = Decimal("0.00") if subtotal >= Decimal("75.00") else Decimal("10.00")
    return subtotal, shipping, money(subtotal + shipping)


