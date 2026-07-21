from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from repositories.monthly_review_repository import MonthlyReviewRepository
from repositories.daily_wellness_repository import DailyWellnessRepository
from repositories.assessment_repository import AssessmentRepository
from services.wellness_intelligence_engine import WellnessIntelligenceEngine
from services.ai_orchestrator import AIOrchestrator

class MonthlyReviewService:
    """
    Service coordinating monthly wellness review calculations, compiling stats,
    querying AIOrchestrator for summaries, and caching reviews in MongoDB.
    """

    def __init__(
        self,
        review_repo: MonthlyReviewRepository,
        wellness_repo: DailyWellnessRepository,
        assessment_repo: AssessmentRepository,
        wellness_engine: WellnessIntelligenceEngine,
        ai_orchestrator: AIOrchestrator
    ) -> None:
        self.review_repo = review_repo
        self.wellness_repo = wellness_repo
        self.assessment_repo = assessment_repo
        self.wellness_engine = wellness_engine
        self.ai_orchestrator = ai_orchestrator

    async def generate_monthly_review(self, user_id: str, month_str: str) -> Dict[str, Any]:
        """
        Calculates trends, requests a summary from AIOrchestrator, and saves review.
        """
        # 1. Fetch checkins and assessments for specified month (YYYY-MM)
        all_checkins = await self.wellness_repo.list_checkins(user_id, limit=100)
        
        # Filter checkins matching month_str (e.g. YYYY-MM)
        month_checkins = [
            c for c in all_checkins 
            if c.get("date", "").startswith(month_str)
        ]

        # Calculate scores
        recent_assessments = await self.assessment_repo.list_assessments(user_id, limit=5)
        # Mock streak_data for monthly scoring context
        streak_data = {"current_streak": 5, "longest_streak": 5, "total_checkins": len(month_checkins)}
        score_info = self.wellness_engine.calculate_unified_score(recent_assessments, month_checkins, streak_data)
        monthly_score = score_info["score"]

        # 2. Extract trends
        trends = self.wellness_engine.get_trends(month_checkins)
        
        # Trend indicators
        stress_trend = "stable"
        if trends["avg_stress"] > 6.0:
            stress_trend = "elevated stress levels"
        elif trends["avg_stress"] < 4.0:
            stress_trend = "manageable low stress"

        sleep_trend = "stable sleep cycles"
        if trends["avg_sleep_hours"] < 6.0:
            sleep_trend = "insufficient rest"
        elif trends["avg_sleep_hours"] >= 7.0:
            sleep_trend = "restorative sleep cycles"

        mood_trend = "stable"
        if month_checkins:
            moods = [c.get("mood") for c in month_checkins if c.get("mood")]
            happy_count = sum(1 for m in moods if m in ("Happy", "Very Happy"))
            sad_count = sum(1 for m in moods if m in ("Sad", "Very Sad"))
            if happy_count > sad_count:
                mood_trend = "positive"
            elif sad_count > happy_count:
                mood_trend = "subdued"

        # Mock achievements list
        achievements = []
        if len(month_checkins) >= 15:
            achievements.append("Wellness Champion (15+ Check-Ins)")
        if trends["exercise_days"] >= 5:
            achievements.append("Fitness Starter (5+ Exercise Days)")
        if not achievements:
            achievements.append("Self-Reflection Advocate")

        # 3. Call AIOrchestrator to produce supportive text analysis
        system_prompt = "You are a professional empathetic wellness companion summarizing a user's monthly progress."
        prompt = f"""Summarize this user's wellness metrics for the month of {month_str}.

Metrics Summary:
- Unified Wellness Score: {monthly_score}/100
- Sleep Trend: {sleep_trend} (Avg: {trends['avg_sleep_hours']} hours)
- Stress Trend: {stress_trend} (Avg: {trends['avg_stress']}/10)
- Mood State: {mood_trend}
- Exercise Days: {trends['exercise_days']} days logged
- Achievements Completed: {', '.join(achievements)}

OUTPUT REQUIREMENT:
Return a clean JSON object containing:
- "ai_summary": string (a warm, supportive 2-3 sentence overview of their progress and encouragement)
- "areas_to_improve": list of strings (1 or 2 areas where they can improve, e.g. ["increase sleep duration"])
- "goals_next_month": list of strings (2 concrete wellness goals for next month, e.g. ["sleep earlier", "active walks"])
"""

        schema = {
            "type": "object",
            "properties": {
                "ai_summary": {"type": "string"},
                "areas_to_improve": {"type": "array", "items": {"type": "string"}},
                "goals_next_month": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["ai_summary", "areas_to_improve", "goals_next_month"]
        }

        try:
            res = self.ai_orchestrator.generate_json(system_prompt=system_prompt, prompt=prompt, schema=schema)
            review_data = res["data"]
        except Exception:
            review_data = {
                "ai_summary": "You've successfully completed another month on your wellness journey. Keep logging to track patterns.",
                "areas_to_improve": ["Keep checking in daily."],
                "goals_next_month": ["Establish a wind-down sleep routine."]
            }

        # 4. Compile total review payload
        review_doc = {
            "month": month_str,
            "monthly_wellness_score": monthly_score,
            "stress_trend": stress_trend,
            "sleep_trend": sleep_trend,
            "mood_trend": mood_trend,
            "exercise_trend": f"{trends['exercise_days']} exercises completed",
            "achievements": achievements,
            "areas_to_improve": review_data["areas_to_improve"],
            "goals_next_month": review_data["goals_next_month"],
            "ai_summary": review_data["ai_summary"]
        }

        # 5. Persist permanently
        await self.review_repo.save_monthly_review(user_id, month_str, review_doc)
        return review_doc
