import unittest
from unittest.mock import AsyncMock, MagicMock
from bson import ObjectId
from repositories.assessment_repository import AssessmentRepository


class TestAssessmentRepository(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        # Mock database and collection
        self.mock_db = MagicMock()
        self.mock_collection = MagicMock()
        self.mock_db.__getitem__.return_value = self.mock_collection
        
        # Instantiate repository with mock database (will bind database["assessments"])
        self.repo = AssessmentRepository(self.mock_db)

        self.sample_assessment = {
            "risk_profile": {"overall_risk": "Moderate"},
            "ai_analysis": {"summary": "This is a summary"}
        }

    async def test_save_assessment(self):
        # Setup mock return value for insert_one
        mock_result = MagicMock()
        mock_id = ObjectId()
        mock_result.inserted_id = mock_id
        self.mock_collection.insert_one = AsyncMock(return_value=mock_result)

        # Execute
        result_id = await self.repo.save_assessment(self.sample_assessment)

        # Assertions
        self.assertEqual(result_id, str(mock_id))
        # Verify the database was called with the exact, unmodified dict
        self.mock_collection.insert_one.assert_awaited_once_with(self.sample_assessment)

    async def test_get_assessment_by_id_success(self):
        # Setup mock return value for find_one
        mock_id = ObjectId()
        mock_doc = dict(self.sample_assessment)
        mock_doc["_id"] = mock_id
        self.mock_collection.find_one = AsyncMock(return_value=mock_doc)

        # Execute
        result = await self.repo.get_assessment_by_id(str(mock_id))

        # Assertions
        self.assertIsNotNone(result)
        self.assertEqual(result["_id"], str(mock_id))
        self.assertEqual(result["risk_profile"], self.sample_assessment["risk_profile"])
        self.mock_collection.find_one.assert_awaited_once_with({"_id": mock_id})

    async def test_get_assessment_by_id_missing(self):
        # Setup mock return value for find_one as None
        self.mock_collection.find_one = AsyncMock(return_value=None)
        mock_id = ObjectId()

        # Execute
        result = await self.repo.get_assessment_by_id(str(mock_id))

        # Assertions
        self.assertIsNone(result)
        self.mock_collection.find_one.assert_awaited_once_with({"_id": mock_id})

    async def test_get_assessment_by_id_invalid_id(self):
        # Execute with an invalid ObjectId representation
        result = await self.repo.get_assessment_by_id("invalid-object-id")

        # Assertions
        self.assertIsNone(result)
        # Verify no database queries were executed
        self.mock_collection.find_one.assert_not_called()

    async def test_list_assessments_success(self):
        # Setup mock list results
        mock_id_1 = ObjectId()
        mock_id_2 = ObjectId()
        mock_docs = [
            {"_id": mock_id_1, "name": "doc1"},
            {"_id": mock_id_2, "name": "doc2"}
        ]
        
        # Mock the cursor returned by find()
        mock_cursor = MagicMock()
        self.mock_collection.find.return_value = mock_cursor
        mock_cursor.sort.return_value = mock_cursor
        mock_cursor.to_list = AsyncMock(return_value=mock_docs)

        # Execute
        result = await self.repo.list_assessments(limit=5)

        # Assertions
        self.mock_collection.find.assert_called_once()
        mock_cursor.sort.assert_called_once_with("_id", -1)
        mock_cursor.to_list.assert_awaited_once_with(length=5)
        
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["_id"], str(mock_id_1))
        self.assertEqual(result[1]["_id"], str(mock_id_2))

    async def test_list_assessments_empty_collection(self):
        # Setup mock to return an empty list
        mock_cursor = MagicMock()
        self.mock_collection.find.return_value = mock_cursor
        mock_cursor.sort.return_value = mock_cursor
        mock_cursor.to_list = AsyncMock(return_value=[])

        # Execute
        result = await self.repo.list_assessments()

        # Assertions
        self.assertEqual(result, [])
        mock_cursor.to_list.assert_awaited_once_with(length=20)

    async def test_delete_assessment_success(self):
        # Setup delete mock returning deleted_count > 0
        mock_result = MagicMock()
        mock_result.deleted_count = 1
        self.mock_collection.delete_one = AsyncMock(return_value=mock_result)
        mock_id = ObjectId()

        # Execute
        deleted = await self.repo.delete_assessment(str(mock_id))

        # Assertions
        self.assertTrue(deleted)
        self.mock_collection.delete_one.assert_awaited_once_with({"_id": mock_id})

    async def test_delete_assessment_missing(self):
        # Setup delete mock returning deleted_count == 0
        mock_result = MagicMock()
        mock_result.deleted_count = 0
        self.mock_collection.delete_one = AsyncMock(return_value=mock_result)
        mock_id = ObjectId()

        # Execute
        deleted = await self.repo.delete_assessment(str(mock_id))

        # Assertions
        self.assertFalse(deleted)
        self.mock_collection.delete_one.assert_awaited_once_with({"_id": mock_id})

    async def test_delete_assessment_invalid_id(self):
        # Execute with an invalid ObjectId representation
        deleted = await self.repo.delete_assessment("invalid-object-id")

        # Assertions
        self.assertFalse(deleted)
        # Verify no database queries were executed
        self.mock_collection.delete_one.assert_not_called()

    def test_serialize_document_none(self):
        # Execute with None
        result = self.repo._serialize_document(None)
        self.assertIsNone(result)

    def test_serialize_document_success(self):
        mock_id = ObjectId()
        raw_doc = {
            "_id": mock_id,
            "name": "Test Assessment",
            "score": 12
        }

        # Execute
        result = self.repo._serialize_document(raw_doc)

        # Assertions
        self.assertIsNotNone(result)
        self.assertEqual(result["_id"], str(mock_id))
        self.assertEqual(result["name"], "Test Assessment")
        self.assertEqual(result["score"], 12)


if __name__ == "__main__":
    unittest.main()
