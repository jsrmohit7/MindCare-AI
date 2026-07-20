import os
import ssl
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncGenerator

import certifi
import motor
import pymongo
from dotenv import load_dotenv
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from core.config import settings
MONGODB_URL = settings.mongodb_url
MONGODB_DB = settings.mongodb_db

client: AsyncIOMotorClient[Any] | None = None
db: AsyncIOMotorDatabase[Any] | None = None


def get_mongo_settings() -> tuple[str, str]:
    return MONGODB_URL, MONGODB_DB


def get_database() -> AsyncIOMotorDatabase[Any]:
    if db is None:
        raise RuntimeError("MongoDB is not connected")
    return db


async def connect_to_mongo() -> None:
    global client, db

    if client is not None and db is not None:
        return

    mongodb_url, mongodb_db = get_mongo_settings()

    if not mongodb_url:
        raise RuntimeError(f"MONGODB_URL is not configured. Expected it in {ENV_PATH}")

    mongo_client = AsyncIOMotorClient(
        mongodb_url,
        serverSelectionTimeoutMS=5000,
        connect=False,
        tlsCAFile=certifi.where()
    )

    client = mongo_client
    db = mongo_client[mongodb_db]

    print("[Mongo Startup Diagnostics]")
    print("sys.executable:", sys.executable)
    print("ssl.OPENSSL_VERSION:", ssl.OPENSSL_VERSION)
    print("pymongo.version:", pymongo.version)
    print("motor.__version__:", getattr(motor, "__version__", getattr(motor, "version", "unknown")))
    print("certifi.where():", certifi.where())
    print("MONGODB_URL:", mongodb_url)

    try:
        await client.admin.command("ping")
        print("Connected to MongoDB successfully.")
        await db.users.create_index("email", unique=True)
        print("Created unique index on users.email")
    except Exception as exc:
        print(f"MongoDB ping failed during startup: {exc}")


async def close_mongo_connection() -> None:
    global client, db

    if client is not None:
        client.close()
    client = None
    db = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    from core.logging import setup_logging
    setup_logging()

    # Access settings to trigger configuration validation
    from core.config import settings
    _ = settings

    await connect_to_mongo()
    try:
        yield
    finally:
        await close_mongo_connection()
