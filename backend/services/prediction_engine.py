from typing import Any, Dict, List, Optional
from services.ai_orchestrator import AIOrchestrator

class PredictionEngine:
    """
    Service responsible for calculating probabilistic forecasts regarding stress,
    mood, burnout risk, and recovery progress.
    """

    def __init__(self, ai_orchestrator: AIOrchestrator) -> None:
        self.ai_orchestrator = ai_orchestrator

    def get_predictions(
        self,
        assessments: List[Dict[str, Any]],
        checkins: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Runs analysis over assessment and wellness logs to generate trend predictions.
        Returns probabilistic estimations with confidence levels and recommendations.
        """
        # Default baseline prediction values
        stress_trend = "stable"
        mood_trend = "stable"
        burnout_risk = "Low"
        recovery_progress = 50
        confidence = 75
        reasons = ["Baseline wellness data is consistent."]
        recommendations = ["Continue your daily check-in habits."]

        if not checkins:
            return {
                "stress_trend": stress_trend,
                "mood_trend": mood_trend,
                "burnout_risk": burnout_risk,
                "recovery_progress": recovery_progress,
                "confidence": confidence,
                "reasons": reasons,
                "recommendations": recommendations
            }

        # Calculate some statistics
        recent_checkins = checkins[:7]
        past_checkins = checkins[7:14]

        recent_stress = [c.get("stress", 5) for c in recent_checkins if c.get("stress") is not None]
        past_stress = [c.get("stress", 5) for c in past_checkins if c.get("stress") is not None]

        recent_sleep = []
        sleep_hours_map = {
            "Less than 4 Hours": 3.0, "4–6 Hours": 5.0, "6–8 Hours": 7.0, "More than 8 Hours": 9.0,
            "<4 hrs": 3.0, "4-6 hrs": 5.0, "6-8 hrs": 7.0, "8+ hrs": 9.0
        }
        for c in recent_checkins:
            if c.get("sleep"):
                recent_sleep.append(sleep_hours_map.get(c["sleep"], 7.0))

        avg_recent_stress = sum(recent_stress) / len(recent_stress) if recent_stress else 5.0
        avg_past_stress = sum(past_stress) / len(past_stress) if past_stress else 5.0

        # Predict Stress Trend & Burnout Risk
        if avg_recent_stress > avg_past_stress + 1.0:
            stress_trend = "increasing"
            burnout_risk = "Moderate"
            confidence = 80
            reasons = ["Stress level has risen over the last 7 days."]
            recommendations = ["Incorporate a 5-minute breathing exercise.", "Hydrate regularly."]
            if avg_recent_stress >= 7.0:
                burnout_risk = "High"
                confidence = 87
                reasons.append("Stress levels are persistently elevated (above 7/10).")
                recommendations.append("Consider consulting a mental health professional.")
        elif avg_recent_stress < avg_past_stress - 1.0:
            stress_trend = "decreasing"
            burnout_risk = "Low"
            confidence = 82
            reasons = ["Stress level has declined compared with previous weeks."]
            recommendations = ["Maintain your current relaxation techniques."]

        # Predict Mood Trend
        mood_ratings = [c.get("mood") for c in recent_checkins if c.get("mood")]
        if mood_ratings:
            happy_count = sum(1 for m in mood_ratings if m in ("Happy", "Very Happy"))
            sad_count = sum(1 for m in mood_ratings if m in ("Sad", "Very Sad"))
            if happy_count > sad_count:
                mood_trend = "improving"
            elif sad_count > happy_count:
                mood_trend = "declining"

        # Calculate Recovery Progress based on sleep & exercise in recent logs
        sleep_ok = sum(1 for s in recent_sleep if s >= 7.0)
        exercise_ok = sum(1 for c in recent_checkins if c.get("exercise"))
        recovery_score = int(((sleep_ok / len(recent_checkins) if recent_checkins else 0.5) * 50) +
                             ((exercise_ok / len(recent_checkins) if recent_checkins else 0.5) * 50))
        recovery_progress = max(10, min(100, recovery_score))

        return {
            "stress_trend": stress_trend,
            "mood_trend": mood_trend,
            "burnout_risk": burnout_risk,
            "recovery_progress": recovery_progress,
            "confidence": confidence,
            "reasons": reasons,
            "recommendations": recommendations
        }
