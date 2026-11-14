"""
The knobs of the practice-guest machine, in one place.

Change a number here and run the generator again: with the same SEED and the same
TODAY you always get exactly the same data (that's what "repeatable" means).
"""
from datetime import date, timedelta
from pathlib import Path

# Same seed -> same "random" customers every time (like shuffling a deck the same way)
SEED = 42

# How many practice customers and how much history
N_CUSTOMERS = 500
HISTORY_DAYS = 365

# Churn: the cut-off sits this many days before "today". The AI may only look at what
# happened BEFORE the cut-off; who comes back AFTER it is the answer it must predict.
CHURN_WINDOW_DAYS = 60

# Share of customers who quietly drift away before the cut-off (the future churners)
FADER_SHARE = 0.25

# Generated customers get ids from here up, and an @example.* email (domains reserved
# for examples, so they can never belong to a real person). Wiping uses BOTH rules,
# so the 3 test users, the admin and real sign-ups are never touched.
FIRST_USER_ID = 1001
EMAIL_DOMAINS = ("example.com", "example.org", "example.net")
SESSION_PREFIX = "gen-"   # clickstream sessionId prefix
DEVICE_PREFIX = "gen-"    # user_devices.device_id prefix

# Times are stored in UTC (like the app). Customers live mostly in Nairobi (UTC+3).
LOCAL_UTC_OFFSET_HOURS = 3

ROOT = Path(__file__).resolve().parents[2]          # the repo root
OUTPUT_DIR = ROOT / "ml" / "data" / "generated"     # git-ignored


def dates(today: date | None = None):
    """today, the churn cut-off and the first day of history."""
    today = today or date.today()
    return today, today - timedelta(days=CHURN_WINDOW_DAYS), today - timedelta(days=HISTORY_DAYS)
