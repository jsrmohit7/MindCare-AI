import unittest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import status
from app import app
from services.auth import get_current_user
from api.adaptive_theme_routes import get_adaptive_theme_service
from services.adaptive_theme_service import AdaptiveThemeService

class TestAdaptiveTheme(unittest.TestCase):
    def setUp(self):
        self.mock_user = {"_id": "507f1f77bcf86cd799439011", "email": "test@example.com"}
        self.mock_service = MagicMock()

        app.dependency_overrides[get_current_user] = lambda: self.mock_user
        app.dependency_overrides[get_adaptive_theme_service] = lambda: self.mock_service

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_get_adaptive_theme(self):
        self.mock_service.get_user_theme_state = AsyncMock(return_value={
            "user_id": "507f1f77bcf86cd799439011",
            "detected_emotion": "Calm",
            "theme": "calm",
            "override_theme": None,
            "explanation": "Test explanation",
            "advice": "Test advice",
            "motivation": "Test motivation",
            "show_support_recommendation": False,
            "history": []
        })

        response = self.client.get("/api/v1/adaptive-theme")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["detected_emotion"], "Calm")
        self.assertEqual(data["theme"], "calm")
        self.assertIsNone(data["override_theme"])

    def test_set_theme_override(self):
        self.mock_service.save_theme_override = AsyncMock(return_value={
            "user_id": "507f1f77bcf86cd799439011",
            "detected_emotion": "Calm",
            "theme": "calm",
            "override_theme": "happy",
            "explanation": "Test explanation",
            "advice": "Test advice",
            "motivation": "Test motivation",
            "show_support_recommendation": False,
            "history": []
        })

        payload = {"theme": "happy"}
        response = self.client.post("/api/v1/adaptive-theme/override", json=payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["override_theme"], "happy")

    def test_set_theme_override_invalid(self):
        payload = {"theme": "invalid_theme_name"}
        response = self.client.post("/api/v1/adaptive-theme/override", json=payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_classify_emotion_fallback(self):
        # We instantiate a dummy service to test the helper method directly
        dummy_db = MagicMock()
        dummy_orchestrator = MagicMock()
        service = AdaptiveThemeService(dummy_db, dummy_orchestrator, MagicMock(), MagicMock())
        
        # Test Stressed fallback
        res_stressed = service._classify_emotion_fallback(mood="Neutral", stress=8, anxiety=2, phq_score=2, gad_score=2, notes="")
        self.assertEqual(res_stressed["detected_emotion"], "Stressed")

        # Test Anxious fallback (clinical GAD score)
        res_anxious_clin = service._classify_emotion_fallback(mood="Neutral", stress=2, anxiety=2, phq_score=2, gad_score=12, notes="")
        self.assertEqual(res_anxious_clin["detected_emotion"], "Anxious")

        # Test Low Mood fallback (clinical PHQ score)
        res_low_mood = service._classify_emotion_fallback(mood="Neutral", stress=2, anxiety=2, phq_score=15, gad_score=2, notes="")
        self.assertEqual(res_low_mood["detected_emotion"], "Low Mood")

        # Test Happy fallback
        res_happy = service._classify_emotion_fallback(mood="Very Happy", stress=2, anxiety=2, phq_score=2, gad_score=2, notes="")
        self.assertEqual(res_happy["detected_emotion"], "Happy")

        # Test Focused fallback
        res_focused = service._classify_emotion_fallback(mood="Neutral", stress=2, anxiety=2, phq_score=2, gad_score=2, notes="need to focus on my study goals today")
        self.assertEqual(res_focused["detected_emotion"], "Focused")

        # Test Calm default
        res_calm = service._classify_emotion_fallback(mood="Neutral", stress=4, anxiety=4, phq_score=2, gad_score=2, notes="feeling okay")
        self.assertEqual(res_calm["detected_emotion"], "Calm")
