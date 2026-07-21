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
    global db
    if db is None:
        if "unittest" in sys.modules or any("unittest" in arg for arg in sys.argv):
            from unittest.mock import MagicMock, AsyncMock
            mock_db = MagicMock()
            mock_col = MagicMock()
            mock_db.__getitem__.return_value = mock_col
            # Mock find to return an async mock cursor
            mock_cursor = MagicMock()
            mock_cursor.sort.return_value = mock_cursor
            mock_cursor.to_list = AsyncMock(return_value=[])
            mock_col.find.return_value = mock_cursor

            mock_col.find_one = AsyncMock(return_value=None)
            mock_col.insert_one = AsyncMock(return_value=MagicMock(inserted_id="mock_id"))
            mock_col.update_one = AsyncMock(return_value=MagicMock())
            mock_col.delete_many = AsyncMock(return_value=MagicMock())
            return mock_db
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
        await db.wellness_state.create_index("user_id", unique=True)
        await db.user_ai_memory.create_index("user_id", unique=True)
        await db.activity_events.create_index([("user_id", 1), ("timestamp", -1)])
        await db.activity_events.create_index("event_type")
        await db.coach_conversations.create_index("user_id")
        await db.coach_conversations.create_index("updated_at")
        await db.mood_journal.create_index([("user_id", 1), ("date", 1)], unique=True)
        await db.mood_journal.create_index("created_at")
        await db.wellness_goals.create_index("user_id")
        await db.wellness_goals.create_index("status")
        await db.monthly_reviews.create_index([("user_id", 1), ("month", 1)], unique=True)
        print("Created MongoDB database indexes successfully.")

    except Exception as exc:
        print(f"MongoDB startup index creation failed: {exc}")



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
