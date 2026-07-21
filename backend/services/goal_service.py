from typing import Any, Dict, List, Optional
from repositories.goal_repository import GoalRepository
from repositories.activity_repository import ActivityRepository

class GoalService:
    """
    Service responsible for coordinating wellness goals, suggesting goals using
    Decision Engine rules, and logging goal accomplishments to the activity store.
    """

    def __init__(self, goal_repo: GoalRepository, activity_repo: ActivityRepository) -> None:
        self.goal_repo = goal_repo
        self.activity_repo = activity_repo

    async def create_goal(self, user_id: str, title: str, goal_type: str, target_value: float, frequency: str, ai_suggested: bool = False) -> str:
        """Creates a goal and logs timeline event."""
        goal_data = {
            "title": title,
            "type": goal_type,
            "target_value": target_value,
            "frequency": frequency,
            "status": "active",
            "progress": 0.0,
            "ai_suggested": ai_suggested
        }
        goal_id = await self.goal_repo.create_goal(user_id, goal_data)
        
        # Log Activity Event
        await self.activity_repo.log_event(
            user_id=user_id,
            source_collection="wellness_goals",
            event_type="goal",
            title="Goal Created",
            description=f"Set a wellness goal: '{title}'",
            metadata={"goal_id": goal_id, "type": goal_type}
        )
        return goal_id

    async def complete_goal(self, user_id: str, goal_id: str) -> bool:
        """Marks a goal as completed and logs timeline event."""
        goal = await self.goal_repo.get_goal_by_id(user_id, goal_id)
        if not goal or goal.get("status") == "completed":
            return False

        update_data = {
            "status": "completed",
            "progress": goal.get("target_value", 100.0)
        }
        success = await self.goal_repo.update_goal(user_id, goal_id, update_data)
        if not success:
            return False

        # Log Activity Event
        await self.activity_repo.log_event(
            user_id=user_id,
            source_collection="wellness_goals",
            event_type="goal",
            title="Goal Completed",
            description=f"Accomplished set goal: '{goal.get('title')}'! 🎉",
            metadata={"goal_id": goal_id, "type": goal.get("type")}
        )
        return True

    async def suggest_goals(self, user_id: str, dashboard_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Dynamically proposes wellness goals based on current dashboard decision priorities.
        """
        priority_habit = dashboard_state.get("priority_habit", "Self-Reflection")
        focus = dashboard_state.get("focus", "Complete Today's Check-In")

        suggestions = []
        if priority_habit == "Meditation" or "Stress" in focus:
            suggestions = [
                {
                    "title": "Daily 5-Min Meditation",
                    "type": "meditation",
                    "target_value": 5.0,
                    "frequency": "daily",
                    "reason": "To help manage elevated stress levels detected in your profile."
                },
                {
                    "title": "Daily Breathing Wind-Down",
                    "type": "meditation",
                    "target_value": 1.0,
                    "frequency": "daily",
                    "reason": "Calming breathing helps restore nervous system balance."
                }
            ]
        elif priority_habit == "Sleep Hygiene" or "Sleep" in focus:
            suggestions = [
                {
                    "title": "Head to bed by 10:30 PM",
                    "type": "sleep",
                    "target_value": 1.0,
                    "frequency": "daily",
                    "reason": "Consistent sleep schedule speeds recovery and wellness balance."
                },
                {
                    "title": "Aim for 7.5 Hours Sleep",
                    "type": "sleep",
                    "target_value": 7.5,
                    "frequency": "daily",
                    "reason": "Restorative sleep helps reduce daytime anxiety."
                }
            ]
        elif priority_habit == "Exercise" or "Active" in focus:
            suggestions = [
                {
                    "title": "20-Min Morning Walk",
                    "type": "exercise",
                    "target_value": 20.0,
                    "frequency": "daily",
                    "reason": "Light cardio boosts endorphins and morning mood levels."
                },
                {
                    "title": "Active Workout Session",
                    "type": "exercise",
                    "target_value": 3.0,
                    "frequency": "weekly",
                    "reason": "Regular weekly workouts help stabilize anxiety spikes."
                }
            ]
        else:
            # Default hydration & consistency goals
            suggestions = [
                {
                    "title": "Hydrate with 2.5L Water",
                    "type": "hydration",
                    "target_value": 2.5,
                    "frequency": "daily",
                    "reason": "Proper hydration keeps energy and mental clarity peak."
                },
                {
                    "title": "Wellness Check Streak of 5 Days",
                    "type": "custom",
                    "target_value": 5.0,
                    "frequency": "weekly",
                    "reason": "Consistent logs optimize daily companion guidance."
                }
            ]

        # Add suggested flag
        for s in suggestions:
            s["ai_suggested"] = True

        return suggestions
