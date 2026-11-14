"""
The one command: wipe the old practice data, make a fresh year of it, save it, report.

    cd ml
    .venv\\Scripts\\python -m data_generation.generate              # wipe + generate
    .venv\\Scripts\\python -m data_generation.generate --wipe-only  # just remove practice data
    .venv\\Scripts\\python -m data_generation.generate --today 2026-11-14   # pretend "today" is another day

Same SEED + same "today" = exactly the same data every time.
"""
import argparse
import csv
from collections import Counter
from datetime import date, datetime, timedelta, timezone

import numpy as np

from . import catalog, config, db, people, simulate, writer


def main():
    ap = argparse.ArgumentParser(description="LuxuryShop practice guests (Phase 5)")
    ap.add_argument("--wipe-only", action="store_true", help="remove generated data and stop")
    ap.add_argument("--today", type=date.fromisoformat, help="the 'today' of the simulation (default: real today)")
    args = ap.parse_args()

    today, cutoff, start = config.dates(args.today)
    # history ends "now" (UTC, like the database), or at the end of a chosen --today
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    end = min(now, datetime(today.year, today.month, today.day) + timedelta(days=1))

    conn, mdb = db.mysql(), db.mongo()
    removed = writer.wipe(conn, mdb)
    print(f"Wiped old practice data: {removed['customers']} customers, {removed['orders']} orders, "
          f"{removed['events']} clicks, {removed['reviews']} reviews")
    if args.wipe_only:
        return

    password = db.customer_password()
    rng = np.random.default_rng(config.SEED)
    products = catalog.load(mdb)
    price_z = catalog.log_price_z(products)
    print(f"Catalogue: {len(products)} live products. Simulating {config.N_CUSTOMERS} customers "
          f"from {start} to {today} (churn cut-off {cutoff})...")

    customers = people.make_customers(rng, today, cutoff, start)
    world = simulate.simulate(customers, products, price_z, rng, today, cutoff, end)
    writer.write(conn, mdb, customers, world, password, end)
    _save_personas(customers)
    _summary(customers, world, cutoff)


def _save_personas(customers):
    """The secret character cards, for checking only (never in the database)."""
    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = config.OUTPUT_DIR / "personas.csv"
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["user_id", "email", "segment", "fader", "fade_start_days_before_cutoff", "taste", "taste2", "signup"])
        for c in customers:
            p = c.persona
            w.writerow([c.id, c.email, p.segment, p.fader, p.fade_start_days_before_cutoff or "", p.taste,
                        p.taste2 or "", c.signup.date()])
    print(f"Personas (for checking only): {path.relative_to(config.ROOT)}")


def _summary(customers, world, cutoff):
    counted = [o for o in world.orders if o.status not in ("CANCELLED", "REFUNDED")]
    revenue = sum(simulate.order_totals(o)[2] for o in counted)
    statuses = Counter(o.status for o in world.orders)
    events = Counter(e["type"] for e in world.events)
    faders = [c for c in customers if c.persona.fader]

    # churn check, using the definition in docs/churn-definition.md
    cutoff_dt = datetime(cutoff.year, cutoff.month, cutoff.day)
    bought_before, bought_after = set(), set()
    for o in counted:
        (bought_before if o.created < cutoff_dt else bought_after).add(o.user.id)
    eligible = [c for c in customers if c.signup < cutoff_dt and c.id in bought_before]
    churned = [c for c in eligible if c.id not in bought_after]
    fader_ids = {c.id for c in faders}

    print("\n================ Practice guests: summary ================")
    print(f"Customers:        {len(customers)}  ({len(faders)} faders = {100 * len(faders) / len(customers):.0f}%)")
    print(f"Orders:           {len(world.orders)}  " + ", ".join(f"{k} {v}" for k, v in statuses.most_common()))
    print(f"Revenue:          ${revenue:,.2f} (cancelled and refunded not counted)")
    print(f"Average order:    ${revenue / max(1, len(counted)):,.2f}")
    print(f"Clicks:           {len(world.events)}  " + ", ".join(f"{k} {v}" for k, v in events.most_common()))
    print(f"View -> purchase: {100 * events['PURCHASE'] / max(1, events['VIEW']):.1f}% of views end in an order")
    print(f"Wishlist rows:    {len(world.wishlists)},  open bags: {len(world.carts)},  reviews: {len(world.reviews)}")
    print(f"Churn check:      {len(eligible)} customers had bought before {cutoff}; "
          f"{len(churned)} did not buy again after it ({100 * len(churned) / max(1, len(eligible)):.0f}%)")
    caught = len([c for c in churned if c.id in fader_ids])
    print(f"                  of those, {caught} are faders and {len(churned) - caught} just went quiet by chance")
    print("============================================================")


if __name__ == "__main__":
    main()
