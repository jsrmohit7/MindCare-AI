from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os

load_dotenv(Path(__file__).resolve().parents[1] / '.env', override=True)

MONGODB_URL = os.getenv('MONGODB_URL')
MONGODB_DB = os.getenv('MONGODB_DB', 'mindcare_ai')

async def main():
    if not MONGODB_URL:
        print('MONGODB_URL not set')
        return
    client = AsyncIOMotorClient(MONGODB_URL)
    try:
        db = client[MONGODB_DB]
        names = await db.list_collection_names()
        print('collections:', names)
    except Exception as e:
        print('ERROR listing collections:', type(e).__name__, e)
    finally:
        client.close()

if __name__ == '__main__':
    asyncio.run(main())
