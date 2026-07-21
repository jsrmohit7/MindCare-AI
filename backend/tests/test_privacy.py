import unittest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import status
from app import app
from services.auth import get_current_user
from api.dependencies import get_privacy_service

class TestPrivacy(unittest.TestCase):
    def setUp(self):
        self.mock_user = {"_id": "507f1f77bcf86cd799439011", "email": "test@example.com"}
        self.mock_service = MagicMock()

        app.dependency_overrides[get_current_user] = lambda: self.mock_user
        app.dependency_overrides[get_privacy_service] = lambda: self.mock_service

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_get_privacy_summary(self):
        self.mock_service.get_personal_data_summary = AsyncMock(return_value={"journals": 2, "goals": 1})
        response = self.client.get("/api/v1/privacy/summary")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["journals"], 2)
        self.assertEqual(data["goals"], 1)

    def test_purge_selective_data(self):
        self.mock_service.purge_journal = AsyncMock()
        response = self.client.delete("/api/v1/privacy/purge/journals")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "purged")
        self.assertEqual(data["category"], "journals")
        self.mock_service.purge_journal.assert_called_once()
