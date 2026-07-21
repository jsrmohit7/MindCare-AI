import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status
from datetime import datetime

from app import app
from services.auth import get_current_user
from api.dependencies import get_coach_repository, get_coach_service
from repositories.coach_repository import CoachRepository
from services.coach_service import CoachService

class TestCoach(unittest.TestCase):
    def setUp(self):
        # Setup mocks
        self.mock_user = {"_id": "507f1f77bcf86cd799439011", "email": "test@example.com", "full_name": "Test User"}
        self.mock_repo = MagicMock()
        self.mock_service = MagicMock()

        app.dependency_overrides[get_current_user] = lambda: self.mock_user
        app.dependency_overrides[get_coach_repository] = lambda: self.mock_repo
        app.dependency_overrides[get_coach_service] = lambda: self.mock_service

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_create_conversation(self):
        mock_conv = {
            "_id": "607f1f77bcf86cd799439022",
            "user_id": "507f1f77bcf86cd799439011",
            "title": "Exam Stress",
            "messages": [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        self.mock_repo.create_conversation = AsyncMock(return_value=mock_conv)

        response = self.client.post("/api/v1/coach/conversations", json={"title": "Exam Stress"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["title"], "Exam Stress")
        self.assertEqual(response.json()["_id"], "607f1f77bcf86cd799439022")

    def test_list_conversations(self):
        mock_convs = [
            {
                "_id": "607f1f77bcf86cd799439022",
                "user_id": "507f1f77bcf86cd799439011",
                "title": "Sleep Problems",
                "messages": [],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
        ]
        self.mock_repo.list_conversations = AsyncMock(return_value=mock_convs)

        response = self.client.get("/api/v1/coach/conversations?search=Sleep")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["title"], "Sleep Problems")

    def test_get_conversation_not_found(self):
        self.mock_repo.get_conversation = AsyncMock(return_value=None)
        response = self.client.get("/api/v1/coach/conversations/nonexistent_id")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_rename_conversation(self):
        mock_conv = {
            "_id": "607f1f77bcf86cd799439022",
            "user_id": "507f1f77bcf86cd799439011",
            "title": "New Title",
            "messages": [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        self.mock_repo.rename_conversation = AsyncMock(return_value=mock_conv)

        response = self.client.put("/api/v1/coach/conversations/607f1f77bcf86cd799439022/rename", json={"title": "New Title"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["title"], "New Title")

    def test_delete_conversation(self):
        self.mock_repo.delete_conversation = AsyncMock(return_value=True)
        response = self.client.delete("/api/v1/coach/conversations/607f1f77bcf86cd799439022")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_chat_message(self):
        self.mock_service.generate_response = AsyncMock(return_value="I am here to help.")

        response = self.client.post(
            "/api/v1/coach/conversations/607f1f77bcf86cd799439022/chat",
            json={"message": "I've been feeling stressed"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["response"], "I am here to help.")
        self.assertEqual(response.json()["conversation_id"], "607f1f77bcf86cd799439022")
