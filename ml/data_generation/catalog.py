"""
Reads the real catalogue from MongoDB, so every generated order uses products,
colours (SKUs), sizes and prices that exist in the shop.
"""
from dataclasses import dataclass, field
from decimal import Decimal

import numpy as np


@dataclass
class Variant:
    sku: str
    color: str
    stock: int
    price: Decimal


@dataclass
class Product:
    id: str
    name: str
    slug: str
    category: str      # men | women | shoes
    sub: str           # topwear, running...
    price: Decimal
    sizes: list
    tags: list
    variants: list = field(default_factory=list)


def load(db) -> list[Product]:
    products = []
    for p in db.products.find({"status": "LIVE"}):
        base = Decimal(str(p["basePrice"].to_decimal()))
        variants = [
            Variant(v["sku"], v["colorName"], int(v.get("stock", 0)),
                    Decimal(str(v["priceOverride"].to_decimal())) if v.get("priceOverride") else base)
            for v in p["variants"]
        ]
        products.append(Product(str(p["_id"]), p["name"], p["slug"], p["category"], p["subCategory"], base,
                                list(p.get("sizes", [])), list(p.get("tags", [])), variants))
    if not products:
        raise SystemExit("No LIVE products in MongoDB. Run database/mongodb/init.js and seed.js first.")
    return products


def log_price_z(products: list[Product]) -> np.ndarray:
    """How expensive each product is compared with the rest (0 = average, +1 = pricier)."""
    logp = np.log([float(p.price) for p in products])
    return (logp - logp.mean()) / logp.std()
