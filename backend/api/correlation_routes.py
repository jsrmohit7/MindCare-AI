from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from services.auth import get_current_user
from api.dependencies import get_daily_wellness_repository
from repositories.daily_wellness_repository import DailyWellnessRepository

router = APIRouter(prefix="/correlations", tags=["Wellness Correlations"])

@router.get("", response_model=Dict[str, Any])
async def get_wellness_correlations_api(
    current_user: dict = Depends(get_current_user),
    wellness_repo: DailyWellnessRepository = Depends(get_daily_wellness_repository)
):
    """
    Exposes statistically observed, non-causative relationships between habits
    (sleep, exercise, meditation, water) and symptoms (stress, anxiety, mood).
    """
    user_id = str(current_user["_id"])
    checkins = await wellness_repo.list_checkins(user_id, limit=30)

    # Base response payload
    response = {
        "sleep_vs_stress": {
            "strength": "weak",
            "direction": "mixed",
            "explanation": "No observable relationship found. Log more sleep details to reveal patterns."
        },
        "exercise_vs_mood": {
            "strength": "weak",
            "direction": "mixed",
            "explanation": "Ensure you log exercise minutes to compute correlations."
        },
        "meditation_vs_anxiety": {
            "strength": "weak",
            "direction": "mixed",
            "explanation": "Complete meditation checks to compare stress scores."
        },
        "hydration_vs_wellness": {
            "strength": "weak",
            "direction": "mixed",
            "explanation": "Track water intake to evaluate daily hydration trends."
        }
    }

    if len(checkins) < 5:
        return response

    # 1. Sleep vs Stress
    sleep_hours_map = {
        "Less than 4 Hours": 3.0, "4–6 Hours": 5.0, "6–8 Hours": 7.0, "More than 8 Hours": 9.0,
        "<4 hrs": 3.0, "4-6 hrs": 5.0, "6-8 hrs": 7.0, "8+ hrs": 9.0
    }
    high_sleep_stress = []
    low_sleep_stress = []
    
    for c in checkins:
        sleep_str = c.get("sleep")
        stress_val = c.get("stress")
        if sleep_str and stress_val is not None:
            hours = sleep_hours_map.get(sleep_str, 7.0)
            if hours >= 7.0:
                high_sleep_stress.append(stress_val)
            else:
                low_sleep_stress.append(stress_val)

    if high_sleep_stress and low_sleep_stress:
        avg_high = sum(high_sleep_stress) / len(high_sleep_stress)
        avg_low = sum(low_sleep_stress) / len(low_sleep_stress)
        diff = avg_low - avg_high
        
        if diff > 1.5:
            response["sleep_vs_stress"] = {
                "strength": "strong",
                "direction": "negative",
                "explanation": "Observational patterns suggest lower stress levels on days following restorative sleep (7+ hours)."
            }
        elif diff > 0.5:
            response["sleep_vs_stress"] = {
                "strength": "moderate",
                "direction": "negative",
                "explanation": "Moderate negative correlation observed: stress levels tend to drop on days with higher sleep duration."
            }
        else:
            response["sleep_vs_stress"] = {
                "strength": "weak",
                "direction": "stable",
                "explanation": "Stress levels remained relatively stable regardless of sleep duration."
            }

    # 2. Exercise vs Mood
    exercise_happy = []
    no_exercise_happy = []
    
    for c in checkins:
        ex = c.get("exercise", False)
        mood = c.get("mood", "")
        if mood:
            is_happy = mood in ("Happy", "Very Happy")
            if ex:
                exercise_happy.append(1 if is_happy else 0)
            else:
                no_exercise_happy.append(1 if is_happy else 0)

    if exercise_happy and no_exercise_happy:
        p_ex = sum(exercise_happy) / len(exercise_happy)
        p_no = sum(no_exercise_happy) / len(no_exercise_happy)
        diff = p_ex - p_no
        
        if diff > 0.30:
            response["exercise_vs_mood"] = {
                "strength": "strong",
                "direction": "positive",
                "explanation": "Active days coincide with a significantly higher percentage of positive mood reports."
            }
        elif diff > 0.10:
            response["exercise_vs_mood"] = {
                "strength": "moderate",
                "direction": "positive",
                "explanation": "Moderate positive trend: mood reports are slightly more favorable on days with exercise."
            }
        else:
            response["exercise_vs_mood"] = {
                "strength": "weak",
                "direction": "stable",
                "explanation": "Mood distribution showed minimal variance between active and rest days."
            }

    # 3. Meditation vs Anxiety
    med_anxiety = []
    no_med_anxiety = []
    
    for c in checkins:
        med = c.get("meditation", False)
        anx = c.get("anxiety")
        if anx is not None:
            if med:
                med_anxiety.append(anx)
            else:
                no_med_anxiety.append(anx)

    if med_anxiety and no_med_anxiety:
        avg_med = sum(med_anxiety) / len(med_anxiety)
        avg_nomed = sum(no_med_anxiety) / len(no_med_anxiety)
        diff = avg_nomed - avg_med
        
        if diff > 1.5:
            response["meditation_vs_anxiety"] = {
                "strength": "strong",
                "direction": "negative",
                "explanation": "Logged meditation sessions correlate strongly with reduced anxiety scores."
            }
        elif diff > 0.5:
            response["meditation_vs_anxiety"] = {
                "strength": "moderate",
                "direction": "negative",
                "explanation": "Anxiety indicators tend to decline slightly on days where meditation check-ins were registered."
            }
        else:
            response["meditation_vs_anxiety"] = {
                "strength": "weak",
                "direction": "stable",
                "explanation": "No clear differentiation in anxiety levels on days with or without mindfulness sessions."
            }

    return response
