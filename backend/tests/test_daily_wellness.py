import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status
from datetime import datetime, date, timedelta

from app import app
from services.auth import get_current_user
from api.dependencies import get_daily_wellness_repository, get_daily_wellness_service
from services.daily_wellness_service import DailyWellnessService

class TestDailyWellness(unittest.TestCase):
    def setUp(self):
        # Setup mocks
        self.mock_user = {"_id": "507f1f77bcf86cd799439011", "email": "test@example.com"}
        self.mock_repo = MagicMock()
        self.mock_service = MagicMock()

        app.dependency_overrides[get_current_user] = lambda: self.mock_user
        app.dependency_overrides[get_daily_wellness_repository] = lambda: self.mock_repo
        app.dependency_overrides[get_daily_wellness_service] = lambda: self.mock_service

        self.client = TestClient(app)

        self.sample_request = {
            "mood": "Happy",
            "stress": 3,
            "anxiety": 2,
            "sleep": "6–8 Hours",
            "exercise": True,
            "exercise_minutes": 30,
            "water": "2–3L",
            "meals": "Healthy",
            "meditation": True,
            "meditation_minutes": 15,
            "notes": "Had a good day!"
        }

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_wellness_score_calculation(self):
        # Instantiate service with none mock objects
        service = DailyWellnessService(MagicMock(), MagicMock())
        
        # Test baseline Happy day
        score = service.calculate_wellness_score(self.sample_request)
        # Expected:
        # Happy: 20
        # Stress 3: 12
        # Anxiety 2: 10
        # Sleep 6-8: 15
        # Exercise True (30m): 10 + min(5, 30//6) = 15
        # Water 2-3L: 8
        # Meditation True (15m): 3 + min(2, 15//10) = 4
        # Meals Healthy: 5
        # Total = 20 + 12 + 10 + 15 + 15 + 8 + 4 + 5 = 89
        self.assertEqual(score, 89)

        # Test extreme sad day
        sad_request = {
            "mood": "Very Sad",
            "stress": 10,
            "anxiety": 10,
            "sleep": "Less than 4 Hours",
            "exercise": False,
            "exercise_minutes": 0,
            "water": "Less than 1L",
            "meals": "Skipped",
            "meditation": False,
            "meditation_minutes": 0
        }
        score_sad = service.calculate_wellness_score(sad_request)
        self.assertEqual(score_sad, 0)

    def test_streak_calculation(self):
        service = DailyWellnessService(MagicMock(), MagicMock())
        today = date(2026, 7, 21)

        # 1. 3-day consecutive streak
        checkins = [
            {"date": "2026-07-21"},
            {"date": "2026-07-20"},
            {"date": "2026-07-19"},
            {"date": "2026-07-15"}
        ]
        curr, longest, total = service.calculate_streaks(checkins, today)
        self.assertEqual(curr, 3)
        self.assertEqual(longest, 3)
        self.assertEqual(total, 4)

        # 2. Yesterday was last check-in (streak still alive)
        yesterday_checkins = [
            {"date": "2026-07-20"},
            {"date": "2026-07-19"}
        ]
        curr_y, longest_y, _ = service.calculate_streaks(yesterday_checkins, today)
        self.assertEqual(curr_y, 2)
        self.assertEqual(longest_y, 2)

        # 3. Gap too large (streak is 0)
        gap_checkins = [
            {"date": "2026-07-18"},
            {"date": "2026-07-17"}
        ]
        curr_g, longest_g, _ = service.calculate_streaks(gap_checkins, today)
        self.assertEqual(curr_g, 0)
        self.assertEqual(longest_g, 2)

    def test_post_checkin_success(self):
        self.mock_repo.get_checkin_by_date = AsyncMock(return_value=None)
        self.mock_repo.save_or_update_checkin = AsyncMock(return_value="mock_doc_id")
        self.mock_repo.list_checkins = AsyncMock(return_value=[])
        
        self.mock_service.calculate_wellness_score.return_value = 89
        self.mock_service.generate_ai_report = AsyncMock(return_value={
            "ai_summary": "Nice day",
            "motivation": "Keep going",
            "daily_goal": "Walk 10 mins"
        })

        response = self.client.post("/api/v1/daily-checkin", json=self.sample_request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        res_data = response.json()
        self.assertEqual(res_data["id"], "mock_doc_id")
        self.assertEqual(res_data["wellness_score"], 89)
        self.assertEqual(res_data["ai_summary"], "Nice day")

    def test_post_checkin_duplicate(self):
        # Simulate existing checkin for today
        self.mock_repo.get_checkin_by_date = AsyncMock(return_value={"_id": "existing_id", "date": "2026-07-21"})

        response = self.client.post("/api/v1/daily-checkin", json=self.sample_request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already completed today", response.json()["error"]["message"])

    def test_get_today_checkin_empty(self):
        self.mock_repo.get_checkin_by_date = AsyncMock(return_value=None)
        response = self.client.get("/api/v1/daily-checkin/today")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.json()["checked_in"])
        self.assertIsNone(response.json()["data"])
