from typing import Any, Dict, List, Optional
from datetime import datetime
from bson import ObjectId

COLLECTION_NAME = "mood_journal"

class JournalRepository:
    """
    Persistence layer responsible for performing CRUD operations on user daily journals
    and storing AI analysis metadata.
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

    async def list_journals(self, user_id: str, limit: int = 50, skip: int = 0, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves user journals, supporting search and pagination."""
        find_query: Dict[str, Any] = {"user_id": user_id}
        if query:
            # Case-insensitive substring search over journal content or tags
            find_query["$or"] = [
                {"content": {"$regex": query, "$options": "i"}},
                {"tags": {"$regex": query, "$options": "i"}}
            ]
        cursor = self.collection.find(find_query).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._serialize_document(doc) for doc in docs if doc is not None]

    async def get_journal_by_id(self, user_id: str, journal_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single journal entry by ID."""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(journal_id), "user_id": user_id})
            return self._serialize_document(doc)
        except Exception:
            return None

    async def get_journal_by_date(self, user_id: str, date_str: str) -> Optional[Dict[str, Any]]:
        """Retrieves journal entry for a specific date (YYYY-MM-DD)."""
        doc = await self.collection.find_one({"user_id": user_id, "date": date_str})
        return self._serialize_document(doc)

    async def create_journal(self, user_id: str, date_str: str, data: Dict[str, Any]) -> str:
        """Inserts a new journal entry into MongoDB."""
        now = datetime.utcnow()
        doc = {
            **data,
            "user_id": user_id,
            "date": date_str,
            "created_at": now,
            "updated_at": now
        }
        result = await self.collection.insert_one(doc)
        return str(result.inserted_id)

    async def update_journal(self, user_id: str, journal_id: str, data: Dict[str, Any]) -> bool:
        """Updates an existing journal entry."""
        try:
            now = datetime.utcnow()
            update_doc = {**data, "updated_at": now}
            # Prevent overriding primary keys
            if "_id" in update_doc:
                del update_doc["_id"]
            if "user_id" in update_doc:
                del update_doc["user_id"]

            result = await self.collection.update_one(
                {"_id": ObjectId(journal_id), "user_id": user_id},
                {"$set": update_doc}
            )
            return result.modified_count > 0
        except Exception:
            return False

    async def delete_journal(self, user_id: str, journal_id: str) -> bool:
        """Deletes a journal entry from MongoDB."""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(journal_id), "user_id": user_id})
            return result.deleted_count > 0
        except Exception:
            return False

    async def delete_all_user_journals(self, user_id: str) -> None:
        """Deletes all journal entries for a user."""
        await self.collection.delete_many({"user_id": user_id})
