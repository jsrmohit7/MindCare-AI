import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status
from app import app
from services.auth import get_current_user
from api.dependencies import get_journal_repository, get_journal_service

class TestJournal(unittest.TestCase):
    def setUp(self):
        self.mock_user = {"_id": "507f1f77bcf86cd799439011", "email": "test@example.com"}
        self.mock_repo = MagicMock()
        self.mock_service = MagicMock()

        app.dependency_overrides[get_current_user] = lambda: self.mock_user
        app.dependency_overrides[get_journal_repository] = lambda: self.mock_repo
        app.dependency_overrides[get_journal_service] = lambda: self.mock_service

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_list_journals(self):
        self.mock_repo.list_journals = AsyncMock(return_value=[{"content": "Logged entry"}])
        response = self.client.get("/api/v1/journal")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["content"], "Logged entry")

    def test_create_journal(self):
        self.mock_service.create_journal_entry = AsyncMock(return_value="entry123")
        payload = {"content": "I feel great today!", "tags": ["calm", "happy"]}
        response = self.client.post("/api/v1/journal", json=payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.json()
        self.assertEqual(data["id"], "entry123")
        self.assertEqual(data["status"], "created")
