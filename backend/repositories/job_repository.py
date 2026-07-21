from typing import Any, Dict, List, Optional
from datetime import datetime

COLLECTION_NAME = "background_jobs"

class JobRepository:
    """
    Persistence layer responsible for tracking background tasks, worker execution metrics,
    durations, and retry cycles.
    """

    def __init__(self, database: Any) -> None:
        self.collection = database[COLLECTION_NAME]

    async def log_job_start(self, job_name: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Logs the start of a background task worker."""
        now = datetime.utcnow()
        doc = {
            "job_name": job_name,
            "status": "running",
            "started_at": now,
            "ended_at": None,
            "duration_seconds": None,
            "retries": 0,
            "error": None,
            "metadata": metadata or {}
        }
        result = await self.collection.insert_one(doc)
        return str(result.inserted_id)

    async def log_job_completion(self, job_id: str, status: str = "completed", error: Optional[str] = None, retries: int = 0) -> bool:
        """Finalizes background task logs, calculating total duration."""
        try:
            from bson import ObjectId
            now = datetime.utcnow()
            existing = await self.collection.find_one({"_id": ObjectId(job_id)})
            if not existing:
                return False

            started_at = existing.get("started_at")
            duration = None
            if started_at:
                duration = (now - started_at).total_seconds()

            update_doc = {
                "status": status,
                "ended_at": now,
                "duration_seconds": duration,
                "retries": retries,
                "error": error
            }
            result = await self.collection.update_one(
                {"_id": ObjectId(job_id)},
                {"$set": update_doc}
            )
            return result.modified_count > 0
        except Exception:
            return False

    async def list_jobs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieves background worker metrics."""
        cursor = self.collection.find({}).sort("started_at", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        for doc in docs:
            if doc and "_id" in doc:
                doc["_id"] = str(doc["_id"])
        return docs
