"""
Makes the practice customers: names, ages, where they live, phones, devices,
clothing sizes, sign-up dates and their secret persona.
About half live in Kenya; the rest in the UAE, UK, US, Nigeria, South Africa,
India, Uganda and Tanzania.
"""
import unicodedata
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta

from faker import Faker

from . import config
from .personas import SEGMENTS, Persona, pick_segment, pick_taste

KENYA_FIRST = {
    "FEMALE": ["Wanjiru", "Achieng", "Njeri", "Chebet", "Wambui", "Atieno", "Nyambura", "Akinyi", "Jepchirchir", "Mwende",
               "Wairimu", "Kanini", "Nafula", "Amina", "Fatuma", "Zawadi", "Imani", "Neema", "Shiru", "Makena", "Kerubo",
               "Moraa", "Awino", "Cherono", "Mumbua", "Halima", "Saida", "Grace", "Faith", "Mercy"],
    "MALE": ["Kamau", "Otieno", "Mwangi", "Kiprop", "Odhiambo", "Wafula", "Mutua", "Kibet", "Omondi", "Njoroge",
             "Ochieng", "Kipchoge", "Barasa", "Muriuki", "Hassan", "Juma", "Baraka", "Brian", "Kevin", "Dennis",
             "Collins", "Victor", "Ian", "Kimani", "Onyango", "Wekesa", "Nyaga", "Rotich", "Salim", "Ali"],
}
KENYA_LAST = ["Kamau", "Otieno", "Mwangi", "Wanjiku", "Odhiambo", "Kiprono", "Chebet", "Njoroge", "Mutua", "Wafula",
              "Omondi", "Kariuki", "Ochieng", "Kimani", "Owino", "Kirui", "Barasa", "Nyamweya", "Gitau", "Mbugua",
              "Achieng", "Wekesa", "Korir", "Muthoni", "Maina", "Langat", "Onyango", "Ndungu", "Mohamed", "Abdalla"]
UAE = (["Fatima", "Mariam", "Noura", "Aisha", "Hessa", "Layla", "Reem", "Shamma"],
       ["Ahmed", "Omar", "Khalid", "Saeed", "Rashid", "Hamdan", "Sultan", "Yousef"],
       ["Al Mansoori", "Al Hashimi", "Al Nuaimi", "Al Suwaidi", "Al Mazrouei", "Al Falasi", "Al Ketbi", "Al Shamsi"])
NIGERIA = (["Ngozi", "Chiamaka", "Funmilayo", "Aisha", "Temitope", "Adaeze", "Bisola", "Zainab"],
           ["Chinedu", "Tunde", "Emeka", "Ibrahim", "Segun", "Olumide", "Uche", "Kelechi"],
           ["Okafor", "Adeyemi", "Okonkwo", "Bello", "Adebayo", "Eze", "Ogunleye", "Nwosu"])
SOUTH_AFRICA = (["Thandiwe", "Lerato", "Naledi", "Zanele", "Palesa", "Ayanda"],
                ["Sipho", "Thabo", "Bongani", "Lwazi", "Kagiso", "Mandla"],
                ["Nkosi", "Dlamini", "Mokoena", "Ndlovu", "Khumalo", "van der Merwe"])
EAST_AFRICA = (["Nakato", "Amani", "Rehema", "Asha", "Namuli"], ["Mukasa", "Baraka", "Juma", "Okello", "Ssali"],
               ["Ssempala", "Mushi", "Nakato", "Massawe", "Kato", "Mrema"])

# country -> (share, cities, faker locale or name lists, phone prefix)
COUNTRIES = [
    ("Kenya", 0.50, ["Nairobi"] * 6 + ["Mombasa", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika"], "KE", "+2547"),
    ("United Arab Emirates", 0.12, ["Dubai", "Dubai", "Abu Dhabi", "Sharjah"], UAE, "+9715"),
    ("United Kingdom", 0.09, ["London", "London", "Manchester", "Birmingham", "Leeds"], "en_GB", "+447"),
    ("United States", 0.09, ["New York", "Los Angeles", "Houston", "Atlanta", "Chicago"], "en_US", "+1"),
    ("Nigeria", 0.06, ["Lagos", "Lagos", "Abuja"], NIGERIA, "+23480"),
    ("South Africa", 0.05, ["Johannesburg", "Cape Town", "Durban"], SOUTH_AFRICA, "+2782"),
    ("India", 0.04, ["Mumbai", "Delhi", "Bengaluru"], "en_IN", "+919"),
    ("Uganda", 0.03, ["Kampala"], EAST_AFRICA, "+2567"),
    ("Tanzania", 0.02, ["Dar es Salaam", "Arusha"], EAST_AFRICA, "+2557"),
]

DEVICES = [  # (type, os, browser, weight)
    ("MOBILE", "Android", "Chrome", 0.34), ("MOBILE", "iOS", "Safari", 0.26),
    ("DESKTOP", "Windows", "Chrome", 0.15), ("DESKTOP", "macOS", "Safari", 0.07), ("DESKTOP", "Windows", "Edge", 0.06),
    ("TABLET", "iPadOS", "Safari", 0.07), ("TABLET", "Android", "Chrome", 0.05),
]


@dataclass
class Device:
    device_id: str
    type: str
    os: str
    browser: str


@dataclass
class Customer:
    id: int
    name: str
    email: str
    gender: str
    dob: date
    country: str
    city: str
    phone: str
    signup: datetime                 # UTC
    persona: Persona
    apparel_size: str
    shoe_size: str
    devices: list = field(default_factory=list)
    preferred: list | None = None
    params: dict = field(default_factory=dict)


def _ascii(s: str) -> str:
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower().replace(" ", "")


def make_customers(rng, today: date, cutoff: date, start: date) -> list[Customer]:
    fakers = {loc: Faker(loc) for loc in ("en_GB", "en_US", "en_IN")}
    for i, f in enumerate(fakers.values()):
        f.seed_instance(config.SEED + i)
    used_emails, customers = set(), []
    shares = [c[1] for c in COUNTRIES]

    for n in range(config.N_CUSTOMERS):
        cid = config.FIRST_USER_ID + n
        country, _, cities, names, phone_prefix = COUNTRIES[rng.choice(len(COUNTRIES), p=shares)]
        gender = str(rng.choice(["FEMALE", "MALE", "OTHER", "PREFER_NOT_TO_SAY"], p=[0.52, 0.44, 0.02, 0.02]))
        name_gender = gender if gender in ("FEMALE", "MALE") else str(rng.choice(["FEMALE", "MALE"]))

        if names == "KE":
            first = str(rng.choice(KENYA_FIRST[name_gender]))
            last = str(rng.choice([n for n in KENYA_LAST if n != first]))
        elif isinstance(names, tuple):
            female, male, lasts = names
            first = str(rng.choice(female if name_gender == "FEMALE" else male))
            last = str(rng.choice(lasts))
        else:
            fk = fakers[names]
            first = fk.first_name_female() if name_gender == "FEMALE" else fk.first_name_male()
            last = fk.last_name()

        # unique, obviously-fake email on a reserved example domain
        base = f"{_ascii(first)}.{_ascii(last)}"
        email = f"{base}@{config.EMAIL_DOMAINS[n % 3]}"
        k = 2
        while email in used_emails:
            email = f"{base}{k}@{config.EMAIL_DOMAINS[n % 3]}"
            k += 1
        used_emails.add(email)

        age = int(np_clip(rng.normal(31, 8), 18, 64))
        dob = date(today.year - age, int(rng.integers(1, 13)), int(rng.integers(1, 29)))
        phone = phone_prefix + "".join(str(d) for d in rng.integers(0, 10, size=9 if phone_prefix != "+1" else 10))

        # persona: segment, fader, taste
        segment = pick_segment(rng)
        fader = bool(rng.random() < config.FADER_SHARE)
        if fader:
            # faders need a past to fade from: they joined at least ~4 months before the cut-off
            signup_day = start + timedelta(days=int(rng.integers(0, max(1, (cutoff - start).days - 120))))
            fade_start = int(rng.integers(30, 121))   # starts drifting 1-4 months before the cut-off
        else:
            # sign-ups spread over the year, a little busier in the most recent months
            span = (today - start).days - 3
            signup_day = start + timedelta(days=int(span * (1 - rng.random() ** 1.3)))
            fade_start = None
        taste = pick_taste(rng, name_gender)
        taste2 = pick_taste(rng, name_gender) if rng.random() < 0.35 else None
        if taste2 == taste:
            taste2 = None
        persona = Persona(segment, fader, fade_start, taste, taste2)

        signup = datetime(signup_day.year, signup_day.month, signup_day.day) + timedelta(
            hours=float(rng.uniform(6, 23)) - config.LOCAL_UTC_OFFSET_HOURS)

        # 1-3 devices
        weights = [d[3] for d in DEVICES]
        total = sum(weights)
        n_dev = int(rng.choice([1, 2, 3], p=[0.45, 0.4, 0.15]))
        picks = rng.choice(len(DEVICES), size=n_dev, replace=False, p=[w / total for w in weights])
        devices = [Device(f"{config.DEVICE_PREFIX}{cid}-{j}", DEVICES[i][0], DEVICES[i][1], DEVICES[i][2])
                   for j, i in enumerate(picks)]

        apparel = (["XS", "S", "M", "L", "XL"], [0.12, 0.3, 0.32, 0.18, 0.08]) if name_gender == "FEMALE" \
            else (["S", "M", "L", "XL", "XXL"], [0.15, 0.32, 0.3, 0.16, 0.07])
        shoes = (["6", "7", "8", "9"], [0.2, 0.35, 0.3, 0.15]) if name_gender == "FEMALE" \
            else (["8", "9", "10", "11", "12"], [0.12, 0.28, 0.3, 0.2, 0.1])

        c = Customer(cid, f"{first} {last}", email, gender, dob, country, str(rng.choice(cities)), phone, signup,
                     persona, str(rng.choice(apparel[0], p=apparel[1])), str(rng.choice(shoes[0], p=shoes[1])), devices)
        c.params = dict(SEGMENTS[segment])
        # 70% fill in "I mostly shop for" on their profile
        if rng.random() < 0.7:
            cats = {"women" if name_gender == "FEMALE" else "men"}
            if taste in ("runners", "lifestyle_sneakers") or rng.random() < 0.4:
                cats.add("shoes")
            c.preferred = sorted(cats)
        customers.append(c)
    return customers


def np_clip(x, lo, hi):
    return max(lo, min(hi, x))
