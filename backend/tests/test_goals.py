import unittest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import status
from app import app
from services.auth import get_current_user
from api.dependencies import get_goal_repository, get_goal_service

class TestGoals(unittest.TestCase):
    def setUp(self):
        self.mock_user = {"_id": "507f1f77bcf86cd799439011", "email": "test@example.com"}
        self.mock_repo = MagicMock()
        self.mock_service = MagicMock()

        app.dependency_overrides[get_current_user] = lambda: self.mock_user
        app.dependency_overrides[get_goal_repository] = lambda: self.mock_repo
        app.dependency_overrides[get_goal_service] = lambda: self.mock_service

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_list_goals(self):
        self.mock_repo.list_goals = AsyncMock(return_value=[{"title": "Sleep 8 hours", "status": "active"}])
        response = self.client.get("/api/v1/goals")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["title"], "Sleep 8 hours")

    def test_create_goal(self):
        self.mock_service.create_goal = AsyncMock(return_value="goal123")
        payload = {"title": "Drink 2L Water", "type": "hydration", "target_value": 2.0}
        response = self.client.post("/api/v1/goals", json=payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["id"], "goal123")
        self.assertEqual(data["status"], "created")
