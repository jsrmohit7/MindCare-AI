import unittest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import status
from app import app
from services.auth import get_current_user
from api.dependencies import get_monthly_review_repository, get_monthly_review_service

class TestMonthlyReview(unittest.TestCase):
    def setUp(self):
        self.mock_user = {"_id": "507f1f77bcf86cd799439011", "email": "test@example.com"}
        self.mock_repo = MagicMock()
        self.mock_service = MagicMock()

        app.dependency_overrides[get_current_user] = lambda: self.mock_user
        app.dependency_overrides[get_monthly_review_repository] = lambda: self.mock_repo
        app.dependency_overrides[get_monthly_review_service] = lambda: self.mock_service

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_get_monthly_review_cached(self):
        self.mock_repo.get_monthly_review = AsyncMock(return_value={"monthly_wellness_score": 82, "month": "2026-07"})
        response = self.client.get("/api/v1/monthly-review?month=2026-07")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["monthly_wellness_score"], 82)
        self.assertEqual(data["month"], "2026-07")
