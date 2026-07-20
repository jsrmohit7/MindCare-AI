from typing import Any, Dict, List, Tuple
from datetime import datetime, date, timedelta
import json
import logging
from services.granite_service import GraniteService

logger = logging.getLogger("mindcare_ai.daily_wellness_service")

class DailyWellnessService:
    """
    Orchestrates business logic for Daily Wellness Check-Ins:
    - Calculates wellness score
    - Calculates current/longest streak
    - Prepares data and requests AI generation from GraniteService
    """

    def __init__(self, repository: Any, granite_service: GraniteService) -> None:
        self.repository = repository
        self.granite_service = granite_service

    def calculate_wellness_score(self, data: Dict[str, Any]) -> int:
        """
        Deterministically calculates a wellness score (0-100) based on check-in parameters:
        - Mood: 25 pts
        - Stress: 15 pts
        - Anxiety: 10 pts
        - Sleep: 15 pts
        - Exercise: 15 pts
        - Water: 10 pts
        - Meditation: 5 pts
        - Meals: 5 pts
        """
        score = 0

        # 1. Mood (25 pts)
        mood_map = {
            "Very Happy": 25,
            "Happy": 20,
            "Neutral": 15,
            "Sad": 8,
            "Very Sad": 0
        }
        score += mood_map.get(data.get("mood", "Neutral"), 15)

        # 2. Stress (15 pts)
        stress = data.get("stress", 5)
        if stress <= 2:
            score += 15
        elif stress <= 4:
            score += 12
        elif stress <= 6:
            score += 8
        elif stress <= 8:
            score += 4
        else:
            score += 0

        # 3. Anxiety (10 pts)
        anxiety = data.get("anxiety", 5)
        if anxiety <= 2:
            score += 10
        elif anxiety <= 4:
            score += 8
        elif anxiety <= 6:
            score += 5
        elif anxiety <= 8:
            score += 2
        else:
            score += 0

        # 4. Sleep (15 pts)
        sleep_map = {
            "Less than 4 Hours": 0,
            "4–6 Hours": 8,
            "6–8 Hours": 15,
            "More than 8 Hours": 12,
            # Handle variations
            "<4 hrs": 0,
            "4-6 hrs": 8,
            "6-8 hrs": 15,
            "8+ hrs": 12
        }
        score += sleep_map.get(data.get("sleep", "6–8 Hours"), 15)

        # 5. Exercise (15 pts)
        if data.get("exercise", False):
            minutes = data.get("exercise_minutes", 0)
            score += 10 + min(5, minutes // 6)
        else:
            score += 0

        # 6. Water Intake (10 pts)
        water_map = {
            "Less than 1L": 0,
            "1–2L": 5,
            "2–3L": 8,
            "More than 3L": 10,
            # Handle variations
            "Less than 1L": 0,
            "1-2L": 5,
            "2-3L": 8,
            "3L+": 10
        }
        score += water_map.get(data.get("water", "1–2L"), 5)

        # 7. Meditation (5 pts)
        if data.get("meditation", False):
            minutes = data.get("meditation_minutes", 0)
            score += 3 + min(2, minutes // 10)
        else:
            score += 0

        # 8. Meals (5 pts)
        meals_map = {
            "Skipped": 0,
            "Normal": 3,
            "Healthy": 5
        }
        score += meals_map.get(data.get("meals", "Normal"), 3)

        return min(100, max(0, score))

    def calculate_streaks(self, checkins: List[Dict[str, Any]], target_date: date) -> Tuple[int, int, int]:
        """
        Calculates current streak, longest streak, and total check-ins count.
        """
        if not checkins:
            return 0, 0, 0

        # Extract unique dates sorted descending
        checkin_dates = sorted(
            list(set(datetime.strptime(c["date"], "%Y-%m-%d").date() for c in checkins)),
            reverse=True
        )

        total_checkins = len(checkin_dates)

        # Current streak calculation
        current_streak = 0
        expected_date = target_date
        
        # If the user didn't check in today, check if they checked in yesterday to keep the streak alive
        if expected_date not in checkin_dates:
            expected_date = expected_date - timedelta(days=1)

        for d in checkin_dates:
            # Skip dates in the future
            if d > target_date:
                continue
            if d == expected_date:
                current_streak += 1
                expected_date = expected_date - timedelta(days=1)
            elif d < expected_date:
                break # Streak broken

        # Longest streak calculation
        longest_streak = 0
        temp_streak = 0
        prev_date = None

        # Sort ascending for forward calculation
        for d in sorted(checkin_dates):
            if prev_date is None:
                temp_streak = 1
            elif d == prev_date + timedelta(days=1):
                temp_streak += 1
            elif d > prev_date + timedelta(days=1):
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
            prev_date = d
        
        longest_streak = max(longest_streak, temp_streak)

        return current_streak, longest_streak, total_checkins

    async def generate_ai_report(self, today_data: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, str]:
        """
        Invokes IBM Granite model to generate personalized analysis.
        """
        # Format recent history for trend comparisons
        recent_logs = []
        for h in history[:5]: # Compare with up to 5 past entries
            recent_logs.append(
                f"- Date: {h['date']}, Mood: {h.get('mood')}, Stress: {h.get('stress')}/10, Sleep: {h.get('sleep')}"
            )
        history_str = "\n".join(recent_logs) if recent_logs else "No previous entries."

        prompt = f"""
You are the MindCare AI Wellness Assistant.
Analyze the user's daily check-in data and compare it to their recent trends.

Today's Check-in Data:
- Mood: {today_data.get('mood')}
- Stress Level: {today_data.get('stress')}/10
- Anxiety Level: {today_data.get('anxiety')}/10
- Sleep: {today_data.get('sleep')}
- Exercise: {'Yes (' + str(today_data.get('exercise_minutes', 0)) + ' mins)' if today_data.get('exercise') else 'No'}
- Water Intake: {today_data.get('water')}
- Meals: {today_data.get('meals')}
- Meditation: {'Yes (' + str(today_data.get('meditation_minutes', 0)) + ' mins)' if today_data.get('meditation') else 'No'}
- Notes: "{today_data.get('notes', '')}"

Recent Wellness History:
{history_str}

Provide your feedback in a clean JSON object containing exactly the following keys. Do not include any markdown format blocks around the JSON output, just plain text JSON.

Required Keys:
- "ai_summary": A supportive overview of their wellness state today (max 2 sentences).
- "positive_observations": A list of 1 or 2 positive things they accomplished today (e.g. staying hydrated, exercising, meditating).
- "areas_to_improve": A list of 1 or 2 areas where they can improve based on stress, sleep, or skipping meals.
- "personalized_advice": A concrete, practical wellness suggestion (max 2 sentences).
- "motivation": A short, inspiring quote or phrase.
- "daily_goal": A small, achievable goal for tomorrow.
"""
        try:
            ai_res = self.granite_service.generate_analysis(prompt)
            return {
                "ai_summary": ai_res.get("ai_summary", "Excellent job checking in with yourself today. Keep up the good work!"),
                "motivation": ai_res.get("motivation", "Small steps lead to big changes."),
                "daily_goal": ai_res.get("daily_goal", "Practice 5 minutes of deep breathing tomorrow.")
            }
        except Exception as exc:
            logger.error("AI Report generation failed: %s", exc)
            # Safe local fallback
            return {
                "ai_summary": "Great check-in. Keep prioritizing sleep and hydration.",
                "motivation": "Consistency is the key to progress.",
                "daily_goal": "Drink 2L of water tomorrow."
            }
