from typing import Any, Dict, List, Tuple
from datetime import datetime, date, timedelta

class WellnessIntelligenceEngine:
    """
    Enterprise-grade analytical engine responsible for computing unified scores,
    calculating trends, and generating contextual history profiles.
    """

    def calculate_unified_score(
        self,
        assessments: List[Dict[str, Any]],
        checkins: List[Dict[str, Any]],
        streak_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates the Unified Wellness Score (0-100) combining clinical assessments,
        daily check-ins, consistency, and streaks.
        """
        # 1. Daily Check-in component (40%)
        # Average wellness_score of checkins in the last 7 days
        recent_checkins = []
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        for c in checkins:
            c_date = datetime.strptime(c["date"], "%Y-%m-%d")
            if c_date >= seven_days_ago:
                recent_checkins.append(c.get("wellness_score", 50))
        
        daily_score = sum(recent_checkins) / len(recent_checkins) if recent_checkins else 50.0

        # 2. Clinical Assessment Component (30%)
        # Based on overall risk score of latest assessment (lower risk = higher wellness)
        clinical_score = 50.0
        if assessments:
            latest = assessments[0]
            risk = latest.get("risk_profile", {}).get("overall_risk", {})
            risk_score = risk.get("score", 50.0)
            clinical_score = 100.0 - risk_score

        # 3. Consistency Component (20%)
        # Density of check-ins in the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        logs_last_30_days = sum(
            1 for c in checkins 
            if datetime.strptime(c["date"], "%Y-%m-%d") >= thirty_days_ago
        )
        consistency_score = (logs_last_30_days / 30.0) * 100.0
        consistency_score = min(100.0, consistency_score)

        # 4. Streak Boost Component (10%)
        curr_streak = streak_data.get("current_streak", 0)
        streak_score = min(100.0, curr_streak * 10.0) # Maximum boost at 10 days

        # Compute combined score
        final_score = (
            (daily_score * 0.40) +
            (clinical_score * 0.30) +
            (consistency_score * 0.20) +
            (streak_score * 0.10)
        )
        final_score = max(0.0, min(100.0, final_score))
        final_score_int = int(round(final_score))

        # Determine Category
        if final_score_int >= 85:
            category = "Excellent"
        elif final_score_int >= 70:
            category = "Good"
        elif final_score_int >= 50:
            category = "Fair"
        else:
            category = "Needs Attention"

        # Determine Trend
        # Compare last 7 days average score with previous 7 days (days 8-14)
        prev_checkins = []
        forteen_days_ago = datetime.utcnow() - timedelta(days=14)
        for c in checkins:
            c_date = datetime.strptime(c["date"], "%Y-%m-%d")
            if forteen_days_ago <= c_date < seven_days_ago:
                prev_checkins.append(c.get("wellness_score", 50))
        
        prev_avg = sum(prev_checkins) / len(prev_checkins) if prev_checkins else 50.0
        diff = daily_score - prev_avg

        if diff > 3.0:
            trend = "improving"
        elif diff < -3.0:
            trend = "declining"
        else:
            trend = "stable"

        return {
            "score": final_score_int,
            "category": category,
            "trend": trend,
            "breakdown": {
                "daily_checkin_avg": round(daily_score, 1),
                "clinical_component": round(clinical_score, 1),
                "consistency": round(consistency_score, 1),
                "streak_boost": round(streak_score, 1)
            }
        }

    def get_trends(self, checkins: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculates historical summaries, sleep, stress averages."""
        if not checkins:
            return {
                "avg_stress": 0.0,
                "avg_anxiety": 0.0,
                "avg_sleep_hours": 0.0,
                "exercise_days": 0,
                "total_days_logged": 0
            }

        stresses = [c["stress"] for c in checkins if "stress" in c]
        anxieties = [c["anxiety"] for c in checkins if "anxiety" in c]
        
        # Sleep ranges to numeric hours
        sleep_hours_map = {
            "Less than 4 Hours": 3.0,
            "4–6 Hours": 5.0,
            "6–8 Hours": 7.0,
            "More than 8 Hours": 9.0,
            "<4 hrs": 3.0,
            "4-6 hrs": 5.0,
            "6-8 hrs": 7.0,
            "8+ hrs": 9.0
        }
        sleeps = []
        for c in checkins:
            if "sleep" in c:
                sleeps.append(sleep_hours_map.get(c["sleep"], 7.0))

        exercise_count = sum(1 for c in checkins if c.get("exercise", False))

        return {
            "avg_stress": round(sum(stresses) / len(stresses), 2) if stresses else 0.0,
            "avg_anxiety": round(sum(anxieties) / len(anxieties), 2) if anxieties else 0.0,
            "avg_sleep_hours": round(sum(sleeps) / len(sleeps), 2) if sleeps else 0.0,
            "exercise_days": exercise_count,
            "total_days_logged": len(checkins)
        }

    def build_ai_context(
        self,
        user_name: str,
        assessments: List[Dict[str, Any]],
        checkins: List[Dict[str, Any]],
        streak_data: Dict[str, Any],
        memory: Dict[str, Any]
    ) -> str:
        """Constructs text template describing user history to feed into the LLM context."""
        latest_assessment = "No clinical assessments completed yet."
        if assessments:
            latest = assessments[0]
            risk = latest.get("risk_profile", {}).get("overall_risk", {})
            latest_assessment = f"Risk Level: {risk.get('level', 'N/A')}, Score: {risk.get('score', 'N/A')}/100"

        recent_logs = []
        for c in checkins[:5]:
            recent_logs.append(
                f"- Date: {c['date']}, Mood: {c.get('mood')}, Stress: {c.get('stress')}/10, Sleep: {c.get('sleep')}"
            )
        checkins_str = "\n".join(recent_logs) if recent_logs else "No recent check-ins."

        # Compile memory fields
        stressors = ", ".join(memory.get("known_stressors", [])) or "None identified"
        habits = ", ".join(memory.get("helpful_habits", [])) or "None identified"

        return f"""User Name: {user_name}
Latest Assessment: {latest_assessment}
Current Streak: {streak_data.get('current_streak', 0)} Days
Longest Streak: {streak_data.get('longest_streak', 0)} Days

Recent Check-ins:
{checkins_str}

AI Memory State:
- Known Stressors: {stressors}
- Helpful Habits: {habits}
- Encouragement Style: {memory.get('encouragement_style', 'gentle validation')}
"""
