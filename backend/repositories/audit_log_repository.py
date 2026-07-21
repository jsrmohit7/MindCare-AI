from typing import Any, Dict, List, Optional
from datetime import datetime

COLLECTION_NAME = "audit_logs"

class AuditLogRepository:
    """
    Persistence layer responsible for logging security, privacy, admin,
    and authentication operations to MongoDB.
    """

    def __init__(self, database: Any) -> None:
        self.collection = database[COLLECTION_NAME]

    async def log_action(
        self,
        action: str,
        user_id: Optional[str] = None,
        status: str = "success",
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Inserts an audit trail record into MongoDB."""
        now = datetime.utcnow()
        doc = {
            "timestamp": now,
            "user_id": user_id or "system",
            "action": action,
            "status": status,
            "metadata": metadata or {}
        }
        result = await self.collection.insert_one(doc)
        return str(result.inserted_id)

    async def list_logs(self, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        """Retrieves raw audit logs chronologically."""
        cursor = self.collection.find({}).sort("timestamp", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        for doc in docs:
            if doc and "_id" in doc:
                doc["_id"] = str(doc["_id"])
        return docs
