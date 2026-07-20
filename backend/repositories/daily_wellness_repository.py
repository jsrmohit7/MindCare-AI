from typing import Any, Dict, List, Optional
from bson import ObjectId
from datetime import datetime

COLLECTION_NAME = "daily_wellness"

class DailyWellnessRepository:
    """
    Persistence layer responsible for reading, writing, and listing
    daily wellness check-in records from MongoDB.
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

    async def save_or_update_checkin(self, user_id: str, date_str: str, checkin_data: Dict[str, Any]) -> str:
        """
        Saves a daily check-in document. If a document already exists for the user
        on the given date (YYYY-MM-DD), updates it.
        """
        now = datetime.utcnow()
        
        # Build search query
        query = {"user_id": user_id, "date": date_str}
        
        # Retrieve existing document to preserve created_at
        existing = await self.collection.find_one(query)
        
        document = {
            "user_id": user_id,
            "date": date_str,
            **checkin_data,
            "updated_at": now
        }
        
        if existing:
            document["created_at"] = existing.get("created_at", now)
            await self.collection.replace_one(query, document)
            return str(existing["_id"])
        else:
            document["created_at"] = now
            result = await self.collection.insert_one(document)
            return str(result.inserted_id)

    async def get_checkin_by_date(self, user_id: str, date_str: str) -> Optional[Dict[str, Any]]:
        """Retrieve check-in record for a user on a specific date (YYYY-MM-DD)."""
        doc = await self.collection.find_one({"user_id": user_id, "date": date_str})
        return self._serialize_document(doc)

    async def list_checkins(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieve historical logs for a user, sorted newest first."""
        cursor = self.collection.find({"user_id": user_id}).sort("date", -1)
        docs = await cursor.to_list(length=limit)
        return [self._serialize_document(doc) for doc in docs if doc is not None]

    async def delete_all_user_checkins(self, user_id: str) -> None:
        """Deletes all check-in records for a given user (mainly used for tests)."""
        await self.collection.delete_many({"user_id": user_id})
