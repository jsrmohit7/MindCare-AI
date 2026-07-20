import unittest
from services.risk_engine import (
    analyze_questionnaire,
    calculate_phq9_metrics,
    calculate_gad7_metrics,
    calculate_stress_metrics,
    calculate_sleep_metrics,
    calculate_lifestyle_metrics,
    calculate_overall_risk
)

class TestRiskEngine(unittest.TestCase):
    def test_low_risk(self):
        low_risk_data = {
            "phq9": {f"q{i}": 0 for i in range(1, 10)},
            "gad7": {f"q{i}": 0 for i in range(1, 8)},
            "stress": [{"answer": 1} for _ in range(6)],
            "sleep": {
                "duration": 8.0,
                "quality": "Excellent",
                "night_awakenings": 0,
                "difficulty_falling_asleep": False
            },
            "lifestyle": {
                "smoking": False,
                "alcohol": "Never",
                "exercise": "Daily",
                "water_intake": 2.5,
                "screen_time": 2.0,
                "diet": "Healthy"
            }
        }
        res = analyze_questionnaire(low_risk_data)
        self.assertEqual(res["phq9"]["score"], 0)
        self.assertEqual(res["phq9"]["severity"], "Minimal Depression")
        self.assertEqual(res["gad7"]["score"], 0)
        self.assertEqual(res["gad7"]["severity"], "Minimal Anxiety")
        self.assertEqual(res["stress"]["score"], 6)
        self.assertEqual(res["stress"]["severity"], "Low")
        self.assertEqual(res["sleep"]["score"], 0)
        self.assertEqual(res["sleep"]["severity"], "Good")
        self.assertEqual(res["lifestyle"]["score"], 0)
        self.assertEqual(res["lifestyle"]["severity"], "Healthy")
        self.assertEqual(res["overall_risk"]["score"], 0)
        self.assertEqual(res["overall_risk"]["level"], "Low")
        self.assertEqual(res["metadata"]["engine"], "Deterministic Weighted Risk Engine")
        self.assertIn("generated_at", res["metadata"])

    def test_high_risk(self):
        high_risk_data = {
            "phq9": {f"q{i}": 3 for i in range(1, 10)},
            "gad7": {f"q{i}": 3 for i in range(1, 8)},
            "stress": [{"answer": 5} for _ in range(6)],
            "sleep": {
                "duration": 4.0,
                "quality": "Poor",
                "night_awakenings": 4,
                "difficulty_falling_asleep": True
            },
            "lifestyle": {
                "smoking": True,
                "alcohol": "Daily",
                "exercise": "Never",
                "water_intake": 0.5,
                "screen_time": 10.0,
                "diet": "Junk"
            }
        }
        res = analyze_questionnaire(high_risk_data)
        self.assertEqual(res["phq9"]["score"], 27)
        self.assertEqual(res["phq9"]["severity"], "Severe Depression")
        self.assertEqual(res["gad7"]["score"], 21)
        self.assertEqual(res["gad7"]["severity"], "Severe Anxiety")
        self.assertEqual(res["stress"]["score"], 30)
        self.assertEqual(res["stress"]["severity"], "High")
        self.assertEqual(res["sleep"]["score"], 100)
        self.assertEqual(res["sleep"]["severity"], "Poor")
        self.assertEqual(res["lifestyle"]["score"], 100)
        self.assertEqual(res["lifestyle"]["severity"], "High Risk")
        self.assertEqual(res["overall_risk"]["score"], 100)
        self.assertEqual(res["overall_risk"]["level"], "High")

    def test_mixed_risk(self):
        mixed_data = {
            "phq9": {"q1": 1, "q2": 2, "q3": 0, "q4": 1, "q5": 0, "q6": 0, "q7": 1, "q8": 0, "q9": 0},
            "gad7": {"q1": 2, "q2": 1, "q3": 0, "q4": 1, "q5": 0, "q6": 0, "q7": 0},
            "stress": [{"answer": 3} for _ in range(6)],
            "sleep": {
                "duration": 6.0,
                "quality": "Fair",
                "night_awakenings": 1,
                "difficulty_falling_asleep": False
            },
            "lifestyle": {
                "smoking": False,
                "alcohol": "Weekly",
                "exercise": "Weekly",
                "water_intake": 1.2,
                "screen_time": 5.0,
                "diet": "Balanced"
            }
        }
        res = analyze_questionnaire(mixed_data)
        self.assertEqual(res["phq9"]["score"], 5)
        self.assertEqual(res["phq9"]["severity"], "Mild Depression")
        self.assertEqual(res["gad7"]["score"], 4)
        self.assertEqual(res["gad7"]["severity"], "Minimal Anxiety")
        self.assertEqual(res["stress"]["score"], 18)
        self.assertEqual(res["stress"]["severity"], "Moderate")
        self.assertEqual(res["sleep"]["score"], 45)
        self.assertEqual(res["sleep"]["severity"], "Fair")
        self.assertEqual(res["lifestyle"]["score"], 40)
        self.assertEqual(res["lifestyle"]["severity"], "Needs Improvement")
        self.assertEqual(res["overall_risk"]["score"], 29)
        self.assertEqual(res["overall_risk"]["level"], "Mild")

if __name__ == '__main__':
    unittest.main()
