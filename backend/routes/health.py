from fastapi import APIRouter, HTTPException

from config.database import get_database

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.get("/health/db")
async def health_db_check():
    try:
        db = get_database()
        await db.command("ping")
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"MongoDB is unavailable: {exc}") from exc

    return {"database": "connected"}
