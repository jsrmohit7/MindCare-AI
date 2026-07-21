from typing import Any, Dict, List, Optional
from datetime import datetime

COLLECTION_NAME = "activity_events"

class ActivityRepository:
    """
    Persistence layer responsible for recording and querying anonymous,
    chronological user activity events (assessments, checkins, chat logs) from MongoDB.
    """

    def __init__(self, database: Any) -> None:
        self.collection = database[COLLECTION_NAME]

    def _serialize_document(self, document: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Converts MongoDB ObjectId fields into JSON-safe strings."""
        if document is None:
            return None
        if "_id" in document:
            document["_id"] = str(document["_id"])
        return document

    async def log_event(
        self,
        user_id: str,
        source_collection: str,
        event_type: str,
        title: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Logs a single user activity event into the centralized event store."""
        now = datetime.utcnow()
        doc = {
            "user_id": user_id,
            "source_collection": source_collection,
            "event_type": event_type,
            "timestamp": now,
            "title": title,
            "description": description,
            "metadata": metadata or {}
        }
        result = await self.collection.insert_one(doc)
        return str(result.inserted_id)

    async def get_user_timeline(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves chronological activity timeline for a user, newest first."""
        cursor = self.collection.find({"user_id": user_id}).sort("timestamp", -1)
        docs = await cursor.to_list(length=limit)
        return [self._serialize_document(doc) for doc in docs if doc is not None]

    async def delete_all_user_activities(self, user_id: str) -> None:
        """Deletes all activity logs for a user (cleanup/tests)."""
        await self.collection.delete_many({"user_id": user_id})
