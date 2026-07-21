import unittest
from services.wellness_intelligence_engine import WellnessIntelligenceEngine
from services.decision_engine import DecisionEngine

class TestDecisionEngine(unittest.TestCase):
    def setUp(self):
        self.wellness_engine = WellnessIntelligenceEngine()
        self.decision_engine = DecisionEngine(self.wellness_engine)
        self.assessments = []
        self.checkins = []
        self.streak_data = {"current_streak": 2, "longest_streak": 2, "total_checkins": 2}

    def test_dashboard_state_without_today_checkin(self):
        state = self.decision_engine.get_dashboard_state(
            assessments=self.assessments,
            checkins=self.checkins,
            streak_data=self.streak_data,
            today_checkin=None
        )
        self.assertEqual(state["focus"], "Complete Today's Check-In")
        self.assertEqual(state["priority_habit"], "Self-Reflection")

    def test_dashboard_state_with_high_stress(self):
        today_checkin = {
            "date": "2026-07-21",
            "stress": 8,
            "anxiety": 5,
            "sleep": "6–8 Hours",
            "exercise": True
        }
        state = self.decision_engine.get_dashboard_state(
            assessments=self.assessments,
            checkins=self.checkins,
            streak_data=self.streak_data,
            today_checkin=today_checkin
        )
        self.assertEqual(state["focus"], "Stress Reduction & Calming")
        self.assertEqual(state["priority_habit"], "Meditation")
