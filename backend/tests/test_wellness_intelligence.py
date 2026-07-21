import unittest
from datetime import datetime, timedelta
from services.wellness_intelligence_engine import WellnessIntelligenceEngine

class TestWellnessIntelligence(unittest.TestCase):
    def setUp(self):
        self.engine = WellnessIntelligenceEngine()
        self.assessments = [
            {
                "risk_profile": {
                    "overall_risk": {
                        "score": 25.0,
                        "level": "Low"
                    }
                },
                "metadata": {
                    "generated_at": "2026-07-21T00:00:00Z"
                }
            }
        ]
        self.checkins = [
            {
                "date": (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d"),
                "wellness_score": 80,
                "stress": 3,
                "anxiety": 2,
                "sleep": "6–8 Hours",
                "exercise": True
            }
            for i in range(5)
        ]
        self.streak_data = {
            "current_streak": 5,
            "longest_streak": 5,
            "total_checkins": 5
        }

    def test_calculate_unified_score(self):
        res = self.engine.calculate_unified_score(
            assessments=self.assessments,
            checkins=self.checkins,
            streak_data=self.streak_data
        )
        self.assertIn("score", res)
        self.assertIn("category", res)
        self.assertIn("trend", res)
        # Check standard range
        self.assertTrue(0 <= res["score"] <= 100)

    def test_get_trends(self):
        trends = self.engine.get_trends(self.checkins)
        self.assertEqual(trends["avg_stress"], 3.0)
        self.assertEqual(trends["avg_anxiety"], 2.0)
        self.assertEqual(trends["exercise_days"], 5)
        self.assertEqual(trends["total_days_logged"], 5)
