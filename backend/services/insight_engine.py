from typing import Any, Dict, List, Optional
from services.ai_orchestrator import AIOrchestrator

class InsightEngine:
    """
    Service responsible for generating context-sensitive insights (daily, weekly, monthly).
    """

    def __init__(self, ai_orchestrator: AIOrchestrator) -> None:
        self.ai_orchestrator = ai_orchestrator

    def generate_today_insight(
        self,
        checkins: List[Dict[str, Any]],
        streak_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates daily wellness highlights based on streaks and recent check-ins.
        """
        current_streak = streak_data.get("current_streak", 0)
        
        if current_streak >= 7:
            insight_text = f"You've maintained a {current_streak}-day streak. Your consistency is unlocking positive mood trends."
        elif current_streak >= 3:
            insight_text = f"Nice {current_streak}-day streak! Completing daily checks helps build stress resilience."
        else:
            insight_text = "Completing check-ins daily lets the companion suggest better coping habits."

        # Add sleep comparison if enough logs
        if len(checkins) >= 7:
            recent_sleep = [c.get("sleep") for c in checkins[:3] if c.get("sleep")]
            past_sleep = [c.get("sleep") for c in checkins[3:7] if c.get("sleep")]
            if recent_sleep and past_sleep and recent_sleep[0] != past_sleep[0]:
                insight_text += " Sleep quality has shifted compared to last week."

        return {
            "insight": insight_text,
            "type": "dashboard",
            "confidence": 85
        }
