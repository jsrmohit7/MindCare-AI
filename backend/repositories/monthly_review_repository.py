from typing import Any, Dict, List, Optional
from datetime import datetime
from bson import ObjectId

COLLECTION_NAME = "monthly_reviews"

class MonthlyReviewRepository:
    """
    Persistence layer responsible for storing and retrieving permanent monthly wellness summaries.
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

    async def get_monthly_review(self, user_id: str, month_str: str) -> Optional[Dict[str, Any]]:
        """Retrieves user review for a specific month (format YYYY-MM)."""
        doc = await self.collection.find_one({"user_id": user_id, "month": month_str})
        return self._serialize_document(doc)

    async def list_monthly_reviews(self, user_id: str, limit: int = 12) -> List[Dict[str, Any]]:
        """Retrieves a chronological list of historical reviews for a user."""
        cursor = self.collection.find({"user_id": user_id}).sort("month", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._serialize_document(doc) for doc in docs if doc is not None]

    async def save_monthly_review(self, user_id: str, month_str: str, data: Dict[str, Any]) -> str:
        """Saves or updates a permanent monthly review."""
        now = datetime.utcnow()
        query = {"user_id": user_id, "month": month_str}
        
        data_to_save = {k: v for k, v in data.items() if k != "_id"}
        data_to_save["user_id"] = user_id
        data_to_save["month"] = month_str
        data_to_save["created_at"] = now

        existing = await self.collection.find_one(query)
        if existing:
            await self.collection.replace_one(query, data_to_save)
            return str(existing["_id"])
        else:
            result = await self.collection.insert_one(data_to_save)
            return str(result.inserted_id)

    async def delete_all_user_reviews(self, user_id: str) -> None:
        """Deletes all monthly reviews for a user."""
        await self.collection.delete_many({"user_id": user_id})
