from typing import Any, Dict, List, Optional
from datetime import datetime
from bson import ObjectId

COLLECTION_NAME = "wellness_goals"

class GoalRepository:
    """
    Persistence layer responsible for performing CRUD operations on user wellness goals.
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

    async def list_goals(self, user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves user goals, optionally filtered by status (active | completed | archived)."""
        query: Dict[str, Any] = {"user_id": user_id}
        if status:
            query["status"] = status
        cursor = self.collection.find(query).sort("created_at", -1)
        docs = await cursor.to_list(length=100)
        return [self._serialize_document(doc) for doc in docs if doc is not None]

    async def get_goal_by_id(self, user_id: str, goal_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single goal entry by ID."""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(goal_id), "user_id": user_id})
            return self._serialize_document(doc)
        except Exception:
            return None

    async def create_goal(self, user_id: str, data: Dict[str, Any]) -> str:
        """Inserts a new wellness goal into MongoDB."""
        now = datetime.utcnow()
        doc = {
            **data,
            "user_id": user_id,
            "created_at": now,
            "updated_at": now
        }
        result = await self.collection.insert_one(doc)
        return str(result.inserted_id)

    async def update_goal(self, user_id: str, goal_id: str, data: Dict[str, Any]) -> bool:
        """Updates an existing wellness goal."""
        try:
            now = datetime.utcnow()
            update_doc = {**data, "updated_at": now}
            if "_id" in update_doc:
                del update_doc["_id"]
            if "user_id" in update_doc:
                del update_doc["user_id"]

            result = await self.collection.update_one(
                {"_id": ObjectId(goal_id), "user_id": user_id},
                {"$set": update_doc}
            )
            return result.modified_count > 0
        except Exception:
            return False

    async def delete_goal(self, user_id: str, goal_id: str) -> bool:
        """Deletes a wellness goal from MongoDB."""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(goal_id), "user_id": user_id})
            return result.deleted_count > 0
        except Exception:
            return False

    async def delete_all_user_goals(self, user_id: str) -> None:
        """Deletes all goals for a user."""
        await self.collection.delete_many({"user_id": user_id})
