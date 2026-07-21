from typing import Any, Dict, List, Optional
from services.wellness_intelligence_engine import WellnessIntelligenceEngine

class DecisionEngine:
    """
    Central business engine responsible for determining user priorities,
    priority habits, and compiling consolidated states for dashboard/UI.
    """

    def __init__(self, wellness_engine: WellnessIntelligenceEngine) -> None:
        self.wellness_engine = wellness_engine

    def get_dashboard_state(
        self,
        assessments: List[Dict[str, Any]],
        checkins: List[Dict[str, Any]],
        streak_data: Dict[str, Any],
        today_checkin: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Processes multi-source wellness information and computes the recommended dashboard context
        (Focus, Priority Habit, Coach Suggestion, Risk Level, Recommendation, and Insight).
        """
        # Calculate unified score
        score_info = self.wellness_engine.calculate_unified_score(assessments, checkins, streak_data)
        score = score_info["score"]
        category = score_info["category"]
        trend = score_info["trend"]

        # Default clinical risk level
        risk_level = "Low"
        if assessments:
            risk_level = assessments[0].get("risk_profile", {}).get("overall_risk", {}).get("level", "Low")

        # Streaks
        current_streak = streak_data.get("current_streak", 0)

        # Logic for focus, priorities, and suggestions
        if not today_checkin:
            focus = "Complete Today's Check-In"
            priority_habit = "Self-Reflection"
            coach_suggestion = "Tell me how your morning is going so far."
            recommendation = "Take 30 seconds to complete today's wellness check-in."
        else:
            stress = today_checkin.get("stress", 5)
            anxiety = today_checkin.get("anxiety", 5)
            sleep = today_checkin.get("sleep", "6–8 Hours")
            exercise = today_checkin.get("exercise", False)

            if stress >= 7 or anxiety >= 7:
                focus = "Stress Reduction & Calming"
                priority_habit = "Meditation"
                coach_suggestion = "Ask me: 'Give me some tips to manage high stress right now.'"
                recommendation = "Practice a 5-minute breathing exercise in a quiet space."
            elif sleep in ("Less than 4 Hours", "4–6 Hours", "<4 hrs", "4-6 hrs"):
                focus = "Rest & Sleep Recovery"
                priority_habit = "Sleep Hygiene"
                coach_suggestion = "Ask me: 'How can I design a better evening wind-down routine?'"
                recommendation = "Aim to drink 2L of water today and head to bed 30 minutes earlier."
            elif not exercise:
                focus = "Active Energy Activation"
                priority_habit = "Exercise"
                coach_suggestion = "Ask me: 'What are some simple 10-minute exercises I can do at home?'"
                recommendation = "Try a light 15-minute stretch or walk to activate endorphins."
            else:
                focus = "Sustain Consistency"
                priority_habit = "Mindfulness"
                coach_suggestion = "Ask me: 'How can I build on this positive momentum today?'"
                recommendation = "Maintain your current routine and check in again tomorrow."

        # Insight card content
        if current_streak >= 7:
            insight = f"Outstanding! You've maintained a {current_streak}-day streak. Consistency builds lasting wellness."
        elif current_streak >= 3:
            insight = f"Nice progress! You are on a {current_streak}-day wellness check-in streak. Keep it up!"
        else:
            insight = "Small daily habits lead to major health breakthroughs. Check in daily to build your streak!"

        return {
            "wellness_score": score,
            "category": category,
            "trend": trend,
            "risk_level": risk_level,
            "focus": focus,
            "priority_habit": priority_habit,
            "coach_suggestion": coach_suggestion,
            "recommendation": recommendation,
            "insight": insight,
            "score_breakdown": score_info["breakdown"]
        }
