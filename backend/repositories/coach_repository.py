from typing import Any, Dict, List, Optional
from bson import ObjectId
from datetime import datetime

COLLECTION_NAME = "coach_conversations"

class CoachRepository:
    """
    Persistence layer responsible for reading, writing, updating,
    and searching AI Coach conversations from MongoDB.
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

    async def create_conversation(self, user_id: str, title: str) -> Dict[str, Any]:
        """Creates a new empty or initial conversation for the user."""
        now = datetime.utcnow()
        doc = {
            "user_id": user_id,
            "title": title,
            "messages": [],
            "created_at": now,
            "updated_at": now
        }
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._serialize_document(doc)

    async def get_conversation(self, user_id: str, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single conversation by ID, checking ownership."""
        if not ObjectId.is_valid(conversation_id):
            return None
        doc = await self.collection.find_one({"_id": ObjectId(conversation_id), "user_id": user_id})
        return self._serialize_document(doc)

    async def list_conversations(self, user_id: str, search_query: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists conversations for a user, optionally filtered by keyword search in title/messages."""
        query = {"user_id": user_id}
        if search_query:
            query["$or"] = [
                {"title": {"$regex": search_query, "$options": "i"}},
                {"messages.content": {"$regex": search_query, "$options": "i"}}
            ]
        cursor = self.collection.find(query).sort("updated_at", -1)
        docs = await cursor.to_list(length=100)
        return [self._serialize_document(doc) for doc in docs if doc is not None]

    async def update_messages(self, user_id: str, conversation_id: str, messages: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Updates the messages array and the updated_at timestamp."""
        if not ObjectId.is_valid(conversation_id):
            return None
        now = datetime.utcnow()
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(conversation_id), "user_id": user_id},
            {
                "$set": {
                    "messages": messages,
                    "updated_at": now
                }
            },
            return_document=True
        )
        return self._serialize_document(result)

    async def rename_conversation(self, user_id: str, conversation_id: str, title: str) -> Optional[Dict[str, Any]]:
        """Renames a conversation title."""
        if not ObjectId.is_valid(conversation_id):
            return None
        now = datetime.utcnow()
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(conversation_id), "user_id": user_id},
            {
                "$set": {
                    "title": title,
                    "updated_at": now
                }
            },
            return_document=True
        )
        return self._serialize_document(result)

    async def delete_conversation(self, user_id: str, conversation_id: str) -> bool:
        """Deletes a conversation."""
        if not ObjectId.is_valid(conversation_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(conversation_id), "user_id": user_id})
        return result.deleted_count > 0

    async def delete_all_user_conversations(self, user_id: str) -> None:
        """Deletes all conversations for a user (useful for cleanup/testing)."""
        await self.collection.delete_many({"user_id": user_id})
