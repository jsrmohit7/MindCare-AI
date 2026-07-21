from typing import Any, Dict, Optional
from datetime import datetime

COLLECTION_NAME = "user_ai_memory"

class MemoryRepository:
    """
    Persistence layer responsible for reading and writing user cognitive details
    (known stressors, coping techniques, goals, preferred encouragement style) to MongoDB.
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

    async def get_memory(self, user_id: str) -> Dict[str, Any]:
        """Retrieves user memory profile, returning a default empty profile if none exists."""
        doc = await self.collection.find_one({"user_id": user_id})
        if not doc:
            # Default empty cognitive state
            return {
                "user_id": user_id,
                "known_stressors": [],
                "helpful_habits": [],
                "goals": [],
                "communication_style": "supportive and conversational",
                "encouragement_style": "gentle validation",
                "recurring_topics": [],
                "milestones": [],
                "behavior_patterns": []
            }
        return self._serialize_document(doc)

    async def save_or_update_memory(self, user_id: str, memory_data: Dict[str, Any]) -> str:
        """Saves or updates user cognitive profile in database."""
        now = datetime.utcnow()
        query = {"user_id": user_id}
        
        # Strip ID from data if present to avoid Mongo replace error
        data_to_save = {k: v for k, v in memory_data.items() if k != "_id"}
        data_to_save["user_id"] = user_id
        data_to_save["updated_at"] = now

        existing = await self.collection.find_one(query)
        if existing:
            await self.collection.replace_one(query, data_to_save)
            return str(existing["_id"])
        else:
            data_to_save["created_at"] = now
            result = await self.collection.insert_one(data_to_save)
            return str(result.inserted_id)

    async def delete_memory(self, user_id: str) -> None:
        """Deletes a user's memory (cleanup/tests)."""
        await self.collection.delete_many({"user_id": user_id})
