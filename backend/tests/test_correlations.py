import unittest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import status
from app import app
from services.auth import get_current_user
from api.dependencies import get_daily_wellness_repository

class TestCorrelations(unittest.TestCase):
    def setUp(self):
        self.mock_user = {"_id": "507f1f77bcf86cd799439011", "email": "test@example.com"}
        self.mock_repo = MagicMock()

        app.dependency_overrides[get_current_user] = lambda: self.mock_user
        app.dependency_overrides[get_daily_wellness_repository] = lambda: self.mock_repo

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_get_wellness_correlations_empty(self):
        self.mock_repo.list_checkins = AsyncMock(return_value=[])
        response = self.client.get("/api/v1/correlations")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["sleep_vs_stress"]["strength"], "weak")
        self.assertEqual(data["exercise_vs_mood"]["strength"], "weak")

    def test_get_wellness_correlations_calculated(self):
        # 5 days checkins
        checkins = [
            {"sleep": "6–8 Hours", "stress": 3, "exercise": True, "meditation": True, "anxiety": 2, "mood": "Happy"},
            {"sleep": "6–8 Hours", "stress": 3, "exercise": True, "meditation": True, "anxiety": 2, "mood": "Happy"},
            {"sleep": "6–8 Hours", "stress": 2, "exercise": True, "meditation": True, "anxiety": 1, "mood": "Very Happy"},
            {"sleep": "4–6 Hours", "stress": 6, "exercise": False, "meditation": False, "anxiety": 5, "mood": "Sad"},
            {"sleep": "4–6 Hours", "stress": 7, "exercise": False, "meditation": False, "anxiety": 6, "mood": "Sad"}
        ]
        self.mock_repo.list_checkins = AsyncMock(return_value=checkins)
        response = self.client.get("/api/v1/correlations")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["sleep_vs_stress"]["strength"], "strong")
        self.assertEqual(data["meditation_vs_anxiety"]["strength"], "strong")
