import unittest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import status
from app import app
from services.auth import get_current_user
from api.dependencies import get_activity_repository

class TestJourney(unittest.TestCase):
    def setUp(self):
        self.mock_user = {"_id": "507f1f77bcf86cd799439011", "email": "test@example.com"}
        self.mock_repo = MagicMock()

        app.dependency_overrides[get_current_user] = lambda: self.mock_user
        app.dependency_overrides[get_activity_repository] = lambda: self.mock_repo

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_get_journey_timeline(self):
        self.mock_repo.get_user_timeline = AsyncMock(return_value=[
            {"event_type": "checkin", "title": "Check-In Completed", "timestamp": "2026-07-21T00:00:00Z"}
        ])
        response = self.client.get("/api/v1/journey")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["event_type"], "checkin")
