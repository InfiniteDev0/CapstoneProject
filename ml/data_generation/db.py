"""
Connections to the two databases, using the same root .env the Java app reads.
MySQL = the receipt book, MongoDB = the menu album and visitor log.
"""
import os

import pymysql
from dotenv import load_dotenv
from pymongo import MongoClient

from .config import ROOT

load_dotenv(ROOT / ".env")


def mysql():
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.environ["MYSQL_USER"],
        password=os.environ["MYSQL_PASSWORD"],
        database=os.environ["MYSQL_DATABASE"],
        charset="utf8mb4",
        autocommit=False,
    )


def mongo():
    client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
    return client[os.getenv("MONGODB_DATABASE", "luxuryshop")]


def customer_password() -> str:
    pw = os.getenv("GEN_CUSTOMER_PASSWORD")
    if not pw or pw == "change-me":
        raise SystemExit("Set GEN_CUSTOMER_PASSWORD in the root .env (the shared password of the practice customers).")
    return pw
