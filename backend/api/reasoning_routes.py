from fastapi import APIRouter, Depends, HTTPException, status
from datetime import date
from typing import Dict, Any
from services.auth import get_current_user
from api.dependencies import (
    get_reasoning_engine,
    get_assessment_repository,
    get_daily_wellness_repository,
    get_daily_wellness_service
)
from repositories.assessment_repository import AssessmentRepository
from repositories.daily_wellness_repository import DailyWellnessRepository
from services.daily_wellness_service import DailyWellnessService
from services.reasoning_engine import ReasoningEngine

router = APIRouter(tags=["Cognitive Reasoning"])

@router.get("/reasoning", response_model=Dict[str, Any])
async def get_cognitive_reasoning(
    current_user: dict = Depends(get_current_user),
    reasoning_engine: ReasoningEngine = Depends(get_reasoning_engine),
    assessment_repo: AssessmentRepository = Depends(get_assessment_repository),
    wellness_repo: DailyWellnessRepository = Depends(get_daily_wellness_repository),
    wellness_service: DailyWellnessService = Depends(get_daily_wellness_service)
):
    """
    Returns explainable AI insights, evidence analysis, contributing root cause factors,
    and ranked personalized recommendations for the logged in user.
    """
    user_id = str(current_user["_id"])
    
    # Retrieve recent data
    assessments = await assessment_repo.list_assessments(user_id, limit=5)
    checkins = await wellness_repo.list_checkins(user_id, limit=30)
    
    current_streak, longest_streak, total_checkins = wellness_service.calculate_streaks(checkins, date.today())
    streak_data = {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_checkins": total_checkins
    }

    reasoning_result = reasoning_engine.generate_reasoning(
        assessments=assessments,
        checkins=checkins,
        streak_data=streak_data
    )

    return reasoning_result
