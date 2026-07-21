import unittest
from services.prediction_engine import PredictionEngine
from services.insight_engine import InsightEngine
from services.reasoning_engine import ReasoningEngine

class TestReasoningEngine(unittest.TestCase):
    def setUp(self):
        self.prediction_engine = PredictionEngine(None)
        self.insight_engine = InsightEngine(None)
        self.reasoning_engine = ReasoningEngine(self.prediction_engine, self.insight_engine)

    def test_generate_reasoning_structure(self):
        assessments = []
        checkins = [
            {"date": "2026-07-21", "stress": 8, "anxiety": 6, "sleep": "Less than 4 Hours", "exercise": False},
            {"date": "2026-07-20", "stress": 7, "anxiety": 5, "sleep": "4–6 Hours", "exercise": False},
            {"date": "2026-07-19", "stress": 7, "anxiety": 5, "sleep": "4–6 Hours", "exercise": False}
        ]
        streak_data = {"current_streak": 3, "longest_streak": 3, "total_checkins": 3}

        res = self.reasoning_engine.generate_reasoning(assessments, checkins, streak_data)
        
        self.assertIn("prediction", res)
        self.assertIn("confidence", res)
        self.assertIn("evidence", res)
        self.assertIn("reasoning", res)
        self.assertIn("recommendations", res)
        self.assertIn("contributing_factors", res)
        self.assertIn("data_sources", res)
        self.assertIn("limitations", res)
        self.assertTrue(0 <= res["confidence"] <= 100)
        self.assertTrue(len(res["contributing_factors"]) > 0)
