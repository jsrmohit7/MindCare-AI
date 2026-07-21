from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from services.auth import get_current_user
from api.dependencies import get_goal_repository, get_goal_service, get_decision_engine, get_assessment_repository, get_daily_wellness_repository, get_daily_wellness_service
from repositories.goal_repository import GoalRepository
from services.goal_service import GoalService
from services.decision_engine import DecisionEngine
from repositories.assessment_repository import AssessmentRepository
from repositories.daily_wellness_repository import DailyWellnessRepository
from services.daily_wellness_service import DailyWellnessService
from datetime import date

router = APIRouter(prefix="/goals", tags=["Wellness Goals"])

@router.get("", response_model=List[Dict[str, Any]])
async def list_goals_api(
    status_filter: Optional[str] = Query(None, description="Filter active | completed | archived"),
    current_user: dict = Depends(get_current_user),
    repo: GoalRepository = Depends(get_goal_repository)
):
    user_id = str(current_user["_id"])
    return await repo.list_goals(user_id, status=status_filter)

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_goal_api(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service)
):
    user_id = str(current_user["_id"])
    title = payload.get("title", "").strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Goal title cannot be empty")
    
    goal_type = payload.get("type", "custom")
    target_value = float(payload.get("target_value", 1.0))
    frequency = payload.get("frequency", "daily")
    ai_suggested = payload.get("ai_suggested", False)

    goal_id = await service.create_goal(
        user_id=user_id,
        title=title,
        goal_type=goal_type,
        target_value=target_value,
        frequency=frequency,
        ai_suggested=ai_suggested
    )
    return {"id": goal_id, "status": "created"}

@router.put("/{goal_id}/complete")
async def complete_goal_api(
    goal_id: str,
    current_user: dict = Depends(get_current_user),
    service: GoalService = Depends(get_goal_service)
):
    user_id = str(current_user["_id"])
    success = await service.complete_goal(user_id, goal_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found or already completed")
    return {"status": "completed"}

@router.delete("/{goal_id}")
async def delete_goal_api(
    goal_id: str,
    current_user: dict = Depends(get_current_user),
    repo: GoalRepository = Depends(get_goal_repository)
):
    user_id = str(current_user["_id"])
    success = await repo.delete_goal(user_id, goal_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return {"status": "deleted"}

@router.get("/suggested", response_model=List[Dict[str, Any]])
async def get_suggested_goals_api(
    current_user: dict = Depends(get_current_user),
    goal_service: GoalService = Depends(get_goal_service),
    decision_engine: DecisionEngine = Depends(get_decision_engine),
    assessment_repo: AssessmentRepository = Depends(get_assessment_repository),
    wellness_repo: DailyWellnessRepository = Depends(get_daily_wellness_repository),
    wellness_service: DailyWellnessService = Depends(get_daily_wellness_service)
):
    user_id = str(current_user["_id"])
    
    # Calculate state to fetch suggested priorities
    assessments = await assessment_repo.list_assessments(user_id, limit=5)
    checkins = await wellness_repo.list_checkins(user_id, limit=30)
    today_checkin = await wellness_repo.get_checkin_by_date(user_id, date.today().strftime("%Y-%m-%d"))
    current_streak, longest_streak, total_checkins = wellness_service.calculate_streaks(checkins, date.today())
    streak_data = {"current_streak": current_streak, "longest_streak": longest_streak, "total_checkins": total_checkins}

    dashboard_state = decision_engine.get_dashboard_state(assessments, checkins, streak_data, today_checkin)
    return await goal_service.suggest_goals(user_id, dashboard_state)
