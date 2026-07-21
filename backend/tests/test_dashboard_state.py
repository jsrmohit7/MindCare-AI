import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status

from app import app
from services.auth import get_current_user
from api.dependencies import (
    get_decision_engine,
    get_assessment_repository,
    get_daily_wellness_repository,
    get_daily_wellness_service,
    get_wellness_state_repository
)
from repositories.assessment_repository import AssessmentRepository
from repositories.daily_wellness_repository import DailyWellnessRepository
from services.daily_wellness_service import DailyWellnessService
from repositories.wellness_state_repository import WellnessStateRepository
from services.decision_engine import DecisionEngine

class TestDashboardStateApi(unittest.TestCase):
    def setUp(self):
        self.mock_user = {"_id": "507f1f77bcf86cd799439011", "email": "test@example.com", "full_name": "Test User"}
        
        self.mock_decision_engine = MagicMock()
        self.mock_assessment_repo = MagicMock()
        self.mock_wellness_repo = MagicMock()
        self.mock_wellness_service = MagicMock()
        self.mock_state_repo = MagicMock()

        app.dependency_overrides[get_current_user] = lambda: self.mock_user
        app.dependency_overrides[get_decision_engine] = lambda: self.mock_decision_engine
        app.dependency_overrides[get_assessment_repository] = lambda: self.mock_assessment_repo
        app.dependency_overrides[get_daily_wellness_repository] = lambda: self.mock_wellness_repo
        app.dependency_overrides[get_daily_wellness_service] = lambda: self.mock_wellness_service
        app.dependency_overrides[get_wellness_state_repository] = lambda: self.mock_state_repo

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_get_dashboard_state_cache_hit(self):
        # Setup mock cache return that is not dirty and matches today's date
        from datetime import datetime
        self.mock_state_repo.get_state = AsyncMock(return_value={
            "wellness_score": 85,
            "category": "Excellent",
            "trend": "stable",
            "focus": "Sustain Consistency",
            "priority_habit": "Mindfulness",
            "last_updated": datetime.utcnow(),
            "dirty": False
        })

        response = self.client.get("/api/v1/dashboard/state")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["wellness_score"], 85)
        self.assertEqual(data["focus"], "Sustain Consistency")

    def test_get_dashboard_state_cache_miss(self):
        # Cache miss
        self.mock_state_repo.get_state = AsyncMock(return_value=None)
        
        # Mock database queries
        self.mock_assessment_repo.list_assessments = AsyncMock(return_value=[])
        self.mock_wellness_repo.list_checkins = AsyncMock(return_value=[])
        self.mock_wellness_repo.get_checkin_by_date = AsyncMock(return_value=None)
        self.mock_wellness_service.calculate_streaks = MagicMock(return_value=(0, 0, 0))
        
        # Mock decision engine calculation
        self.mock_decision_engine.get_dashboard_state.return_value = {
            "wellness_score": 50,
            "category": "Fair",
            "trend": "stable",
            "focus": "Complete Today's Check-In",
            "priority_habit": "Self-Reflection",
            "coach_suggestion": "suggestion",
            "recommendation": "recommendation",
            "insight": "insight"
        }
        self.mock_state_repo.save_or_update_state = AsyncMock(return_value="state_id_123")

        response = self.client.get("/api/v1/dashboard/state")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["wellness_score"], 50)
        self.assertEqual(data["focus"], "Complete Today's Check-In")
        self.mock_state_repo.save_or_update_state.assert_called_once()
