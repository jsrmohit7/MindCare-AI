import unittest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import status

from app import app
from services.auth import get_current_user
from api.dependencies import (
    get_reasoning_engine,
    get_assessment_repository,
    get_daily_wellness_repository,
    get_daily_wellness_service
)
from repositories.assessment_repository import AssessmentRepository
from repositories.daily_wellness_repository import DailyWellnessRepository
from services.daily_wellness_service import DailyWellnessService
from services.reasoning_engine import ReasoningEngine

class TestReasoningRoutes(unittest.TestCase):
    def setUp(self):
        self.mock_user = {"_id": "507f1f77bcf86cd799439011", "email": "test@example.com", "full_name": "Test User"}
        
        self.mock_reasoning_engine = MagicMock()
        self.mock_assessment_repo = MagicMock()
        self.mock_wellness_repo = MagicMock()
        self.mock_wellness_service = MagicMock()

        app.dependency_overrides[get_current_user] = lambda: self.mock_user
        app.dependency_overrides[get_reasoning_engine] = lambda: self.mock_reasoning_engine
        app.dependency_overrides[get_assessment_repository] = lambda: self.mock_assessment_repo
        app.dependency_overrides[get_daily_wellness_repository] = lambda: self.mock_wellness_repo
        app.dependency_overrides[get_daily_wellness_service] = lambda: self.mock_wellness_service

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_get_cognitive_reasoning(self):
        self.mock_assessment_repo.list_assessments = AsyncMock(return_value=[])
        self.mock_wellness_repo.list_checkins = AsyncMock(return_value=[])
        self.mock_wellness_service.calculate_streaks = MagicMock(return_value=(0, 0, 0))
        
        self.mock_reasoning_engine.generate_reasoning.return_value = {
            "prediction": "Stress level is likely stable this week.",
            "confidence": 75,
            "evidence": "evidence",
            "reasoning": "reasoning",
            "recommendations": ["recommendation"],
            "contributing_factors": [{"factor": "factor", "importance": 0.5}],
            "data_sources": ["Daily Wellness"],
            "limitations": "limitations"
        }

        response = self.client.get("/api/v1/reasoning")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["prediction"], "Stress level is likely stable this week.")
        self.assertEqual(data["confidence"], 75)
        self.mock_reasoning_engine.generate_reasoning.assert_called_once()
