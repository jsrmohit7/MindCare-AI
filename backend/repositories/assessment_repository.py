from typing import Any, Dict, List, Optional
from bson import ObjectId

COLLECTION_NAME = "assessments"
DEFAULT_LIST_LIMIT = 20


class AssessmentRepository:
    """
    Dedicated persistence layer responsible for reading, writing, and
    deleting assessment documents from MongoDB.
    """

    def __init__(self, database: Any) -> None:
        self.collection = database[COLLECTION_NAME]

    def _serialize_document(self, document: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Converts MongoDB ObjectId fields into JSON-safe strings.

        Args:
            document: The raw MongoDB document or None.

        Returns:
            The serialized document or None if input was None.
        """
        if document is None:
            return None

        if "_id" in document:
            document["_id"] = str(document["_id"])

        return document

    async def save_assessment(self, assessment: Dict[str, Any], user_id: str) -> str:
        """
        Insert the assessment document with the associated user_id into MongoDB.

        Args:
            assessment: The assessment dictionary.
            user_id: The string representation of the user's ObjectId.

        Returns:
            The string version of the generated ObjectId.
        """
        assessment["user_id"] = user_id
        result = await self.collection.insert_one(assessment)
        return str(result.inserted_id)

    async def get_assessment_by_id(self, assessment_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve one assessment by ID.

        Args:
            assessment_id: The string representation of MongoDB ObjectId.

        Returns:
            The serialized assessment document, or None if not found or invalid ID.
        """
        if not ObjectId.is_valid(assessment_id):
            return None

        doc = await self.collection.find_one({"_id": ObjectId(assessment_id)})
        return self._serialize_document(doc)

    async def list_assessments(self, user_id: str, limit: int = DEFAULT_LIST_LIMIT) -> List[Dict[str, Any]]:
        """
        Retrieve the newest assessments belonging to the specified user up to the limit.

        Args:
            user_id: The string representation of the user's ObjectId.
            limit: The maximum number of assessments to return.

        Returns:
            A list of serialized assessment dictionaries.
        """
        cursor = self.collection.find({"user_id": user_id}).sort("_id", -1)
        docs = await cursor.to_list(length=limit)
        return [self._serialize_document(doc) for doc in docs if doc is not None]

    async def delete_assessment(self, assessment_id: str) -> bool:
        """
        Delete an assessment by ID.

        Args:
            assessment_id: The string representation of MongoDB ObjectId.

        Returns:
            True if the document was deleted, False otherwise.
        """
        if not ObjectId.is_valid(assessment_id):
            return False

        result = await self.collection.delete_one({"_id": ObjectId(assessment_id)})
        return result.deleted_count > 0
