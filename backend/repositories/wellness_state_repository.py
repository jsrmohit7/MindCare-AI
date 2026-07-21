from typing import Any, Dict, Optional
from datetime import datetime

COLLECTION_NAME = "wellness_state"

class WellnessStateRepository:
    """
    Persistence layer responsible for caching the pre-computed user dashboard state
    (Unified Score, Risk level, Today's insights and recommendations) in MongoDB.
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

    async def get_state(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves cached dashboard wellness state for user, returning None if cache miss."""
        doc = await self.collection.find_one({"user_id": user_id})
        return self._serialize_document(doc)

    async def save_or_update_state(self, user_id: str, state_data: Dict[str, Any]) -> str:
        """Saves or updates cached wellness state in database."""
        now = datetime.utcnow()
        query = {"user_id": user_id}

        data_to_save = {k: v for k, v in state_data.items() if k != "_id"}
        data_to_save["user_id"] = user_id
        data_to_save["last_updated"] = now

        existing = await self.collection.find_one(query)
        if existing:
            await self.collection.replace_one(query, data_to_save)
            return str(existing["_id"])
        else:
            result = await self.collection.insert_one(data_to_save)
            return str(result.inserted_id)

    async def set_dirty(self, user_id: str, dirty: bool = True) -> None:
        """Sets the dirty flag on cached wellness state to force recalculation on next access."""
        await self.collection.update_one(
            {"user_id": user_id},
            {"$set": {"dirty": dirty}},
            upsert=False
        )

    async def delete_state(self, user_id: str) -> None:
        """Deletes cached state for a user (cleanup/tests)."""
        await self.collection.delete_many({"user_id": user_id})
