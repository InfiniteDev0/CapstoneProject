"""
The secret character cards. Every practice customer gets:

  * a value SEGMENT: how often they visit and buy, and what they like to spend
  * a FADER flag:    slowly stops coming before the churn cut-off (a future churner)
  * a TASTE group:   which corner of the shop they love (+ sometimes a second one)

These cards are written to ml/data/generated/personas.csv for checking ONLY.
They never go into the database: the AI must discover them from behaviour.
"""
from dataclasses import dataclass

# How each kind of customer behaves.
#   visits:    shop visits per week
#   cart:      chance to add a viewed piece to the bag
#   buy:       chance a visit with a full bag ends in an order
#   price:     + likes expensive pieces, - hunts cheaper ones
#   max_items: most pieces in one order
SEGMENTS = {
    "loyal":       dict(share=0.22, visits=1.40, cart=0.16, buy=0.60, price=0.0, max_items=3),
    "big_spender": dict(share=0.12, visits=0.45, cart=0.20, buy=0.60, price=1.6, max_items=4),
    "bargain":     dict(share=0.24, visits=0.85, cart=0.12, buy=0.42, price=-1.6, max_items=2),
    "casual":      dict(share=0.42, visits=0.60, cart=0.13, buy=0.42, price=0.0, max_items=2),
}


def _tags(p, *words):
    return any(w in p.tags for w in words)


# What each taste group loves. (gender: who mostly belongs to it)
TASTES = {
    "runners": dict(
        gender=None, keywords=["running", "run short", "runner", "trail", "race"],
        likes=lambda p: p.sub == "running" or _tags(p, "running", "race", "trail")),
    "outerwear_lovers": dict(
        gender=None, keywords=["parka", "coat", "jacket", "puffer", "down", "trench"],
        likes=lambda p: p.sub == "outerwear"),
    "lifestyle_sneakers": dict(
        gender=None, keywords=["sneaker", "leather", "boot", "loafer", "bag"],
        likes=lambda p: p.sub == "lifestyle" or (p.sub == "accessories" and _tags(p, "leather"))),
    "womens_training": dict(
        gender="FEMALE", keywords=["legging", "yoga", "seamless", "bra", "tennis", "studio"],
        likes=lambda p: (p.category == "women" and _tags(p, "yoga", "seamless", "training", "tennis"))
        or p.sub == "training"),
    "mens_tailoring": dict(
        gender="MALE", keywords=["overcoat", "chino", "trouser", "belt", "cashmere", "wool"],
        likes=lambda p: p.category == "men" and _tags(p, "tailoring", "wool", "twill", "travel", "leather", "cashmere")),
    "cashmere_lounge": dict(
        gender=None, keywords=["cashmere", "lounge", "hoodie", "merino", "jogger"],
        likes=lambda p: _tags(p, "cashmere", "lounge", "merino")),
}


@dataclass
class Persona:
    segment: str
    fader: bool
    fade_start_days_before_cutoff: int | None   # when the drifting starts (faders only)
    taste: str
    taste2: str | None


def pick_segment(rng) -> str:
    names = list(SEGMENTS)
    return str(rng.choice(names, p=[SEGMENTS[n]["share"] for n in names]))


def pick_taste(rng, gender: str) -> str:
    names = [n for n, t in TASTES.items() if t["gender"] in (None, gender)]
    weights = [3.0 if TASTES[n]["gender"] == gender else 1.0 for n in names]
    total = sum(weights)
    return str(rng.choice(names, p=[w / total for w in weights]))
