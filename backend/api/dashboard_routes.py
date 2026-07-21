from fastapi import APIRouter, Depends, HTTPException, status
from datetime import date
from typing import Dict, Any
from services.auth import get_current_user
from api.dependencies import (
    get_decision_engine,
    get_assessment_repository,
    get_daily_wellness_repository,
    get_daily_wellness_service,
    get_wellness_state_repository
)
from repositories.assessment_repository import AssessmentRepository
from repositories.daily_wellness_repository import DailyWellnessRepository
from services.daily_wellness_service import DailyWellnessService
from repositories.wellness_state_repository import WellnessStateRepository
from services.decision_engine import DecisionEngine

router = APIRouter(tags=["Dashboard State"])

@router.get("/dashboard/state", response_model=Dict[str, Any])
async def get_dashboard_state_api(
    current_user: dict = Depends(get_current_user),
    decision_engine: DecisionEngine = Depends(get_decision_engine),
    assessment_repo: AssessmentRepository = Depends(get_assessment_repository),
    wellness_repo: DailyWellnessRepository = Depends(get_daily_wellness_repository),
    wellness_service: DailyWellnessService = Depends(get_daily_wellness_service),
    state_repo: WellnessStateRepository = Depends(get_wellness_state_repository)
):
    """
    Exposes unified dashboard state combining wellness score calculations,
    risk levels, daily priorities, habit coaching, and insights.
    Caches calculated results inside the wellness_state collection.
    """
    user_id = str(current_user["_id"])
    today_str = date.today().strftime("%Y-%m-%d")

    # 1. Fetch cached state first
    cached = await state_repo.get_state(user_id)
    if cached and not cached.get("dirty", False):
        last_updated = cached.get("last_updated")
        # Ensure cache is from today
        if last_updated and last_updated.date() == date.today():
            return cached

    # 2. Cache miss or dirty: compute new state
    assessments = await assessment_repo.list_assessments(user_id, limit=5)
    checkins = await wellness_repo.list_checkins(user_id, limit=30)
    today_checkin = await wellness_repo.get_checkin_by_date(user_id, today_str)

    current_streak, longest_streak, total_checkins = wellness_service.calculate_streaks(checkins, date.today())
    streak_data = {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_checkins": total_checkins
    }

    state = decision_engine.get_dashboard_state(
        assessments=assessments,
        checkins=checkins,
        streak_data=streak_data,
        today_checkin=today_checkin
    )

    state["dirty"] = False
    state["user_id"] = user_id

    # 3. Cache state in wellness_state collection
    await state_repo.save_or_update_state(user_id, state)

    return state
