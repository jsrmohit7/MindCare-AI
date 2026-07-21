from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from datetime import datetime, date
from typing import Any, List, Dict, Tuple
import io

from services.auth import get_current_user
from schemas.daily_wellness import DailyCheckInRequest
from repositories.daily_wellness_repository import DailyWellnessRepository
from services.daily_wellness_service import DailyWellnessService
from services.pdf_generator import MonthlyPDFGenerator
from api.dependencies import (
    get_daily_wellness_repository,
    get_daily_wellness_service,
    get_activity_repository,
    get_wellness_state_repository
)
from repositories.activity_repository import ActivityRepository
from repositories.wellness_state_repository import WellnessStateRepository


router = APIRouter(tags=["Daily Wellness"])

@router.post("/daily-checkin", status_code=status.HTTP_201_CREATED)
async def create_daily_checkin(
    payload: DailyCheckInRequest,
    current_user: dict = Depends(get_current_user),
    repo: DailyWellnessRepository = Depends(get_daily_wellness_repository),
    service: DailyWellnessService = Depends(get_daily_wellness_service),
    activity_repo: ActivityRepository = Depends(get_activity_repository),
    state_repo: WellnessStateRepository = Depends(get_wellness_state_repository)
) -> dict:
    user_id = str(current_user["_id"])
    date_str = datetime.utcnow().strftime("%Y-%m-%d")

    # Verify if already checked in today
    existing = await repo.get_checkin_by_date(user_id, date_str)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You've already completed today's wellness check."
        )

    # Compute wellness score
    input_dict = payload.model_dump()
    score = service.calculate_wellness_score(input_dict)
    
    # Load history for AI trend analysis
    history = await repo.list_checkins(user_id, limit=5)
    
    # Request Watsonx Granite AI Report
    ai_report = await service.generate_ai_report(input_dict, history)

    document = {
        **input_dict,
        "wellness_score": score,
        "ai_summary": ai_report.get("ai_summary"),
        "motivation": ai_report.get("motivation"),
        "daily_goal": ai_report.get("daily_goal")
    }

    doc_id = await repo.save_or_update_checkin(user_id, date_str, document)

    # Log Activity Event
    await activity_repo.log_event(
        user_id=user_id,
        source_collection="daily_wellness",
        event_type="checkin",
        title="Wellness Check-In Completed",
        description=f"Completed daily check-in. Mood: {payload.mood}, Score: {score}",
        metadata={"checkin_id": doc_id, "wellness_score": score}
    )

    # Mark cached state dirty
    await state_repo.set_dirty(user_id, True)

    return {"id": doc_id, "wellness_score": score, **ai_report}


@router.get("/daily-checkin/today")
async def get_today_checkin(
    current_user: dict = Depends(get_current_user),
    repo: DailyWellnessRepository = Depends(get_daily_wellness_repository)
) -> Any:
    user_id = str(current_user["_id"])
    date_str = datetime.utcnow().strftime("%Y-%m-%d")

    doc = await repo.get_checkin_by_date(user_id, date_str)
    if not doc:
        return {"checked_in": False, "data": None}
    return {"checked_in": True, "data": doc}

@router.put("/daily-checkin/today")
async def update_today_checkin(
    payload: DailyCheckInRequest,
    current_user: dict = Depends(get_current_user),
    repo: DailyWellnessRepository = Depends(get_daily_wellness_repository),
    service: DailyWellnessService = Depends(get_daily_wellness_service),
    activity_repo: ActivityRepository = Depends(get_activity_repository),
    state_repo: WellnessStateRepository = Depends(get_wellness_state_repository)
) -> dict:
    user_id = str(current_user["_id"])
    date_str = datetime.utcnow().strftime("%Y-%m-%d")

    # Verify checkin exists
    existing = await repo.get_checkin_by_date(user_id, date_str)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No daily check-in found for today to update."
        )

    # Re-calculate wellness score
    input_dict = payload.model_dump()
    score = service.calculate_wellness_score(input_dict)

    # Call AI report since text notes or sleep might have updated
    history = await repo.list_checkins(user_id, limit=5)
    # Filter out current day from history context to avoid recursion
    history = [h for h in history if h["date"] != date_str]
    ai_report = await service.generate_ai_report(input_dict, history)

    document = {
        **input_dict,
        "wellness_score": score,
        "ai_summary": ai_report.get("ai_summary"),
        "motivation": ai_report.get("motivation"),
        "daily_goal": ai_report.get("daily_goal")
    }

    await repo.save_or_update_checkin(user_id, date_str, document)

    # Log Activity Event
    await activity_repo.log_event(
        user_id=user_id,
        source_collection="daily_wellness",
        event_type="checkin",
        title="Wellness Check-In Updated",
        description=f"Updated today's daily check-in. Mood: {payload.mood}, Score: {score}",
        metadata={"checkin_id": existing["_id"], "wellness_score": score}
    )

    # Mark cached state dirty
    await state_repo.set_dirty(user_id, True)

    return {"wellness_score": score, **ai_report}


@router.get("/daily-checkin/history")
async def get_checkin_history(
    current_user: dict = Depends(get_current_user),
    repo: DailyWellnessRepository = Depends(get_daily_wellness_repository)
) -> List[dict]:
    user_id = str(current_user["_id"])
    return await repo.list_checkins(user_id, limit=100)

@router.get("/daily-checkin/streak")
async def get_checkin_streak(
    current_user: dict = Depends(get_current_user),
    repo: DailyWellnessRepository = Depends(get_daily_wellness_repository),
    service: DailyWellnessService = Depends(get_daily_wellness_service)
) -> dict:
    user_id = str(current_user["_id"])
    history = await repo.list_checkins(user_id, limit=1000)
    current_date = datetime.utcnow().date()
    
    current_streak, longest_streak, total_checkins = service.calculate_streaks(history, current_date)
    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_checkins": total_checkins
    }

@router.get("/daily-checkin/analytics")
async def get_checkin_analytics(
    current_user: dict = Depends(get_current_user),
    repo: DailyWellnessRepository = Depends(get_daily_wellness_repository)
) -> List[dict]:
    user_id = str(current_user["_id"])
    # Fetch all records up to 90 days for plotting Recharts
    docs = await repo.list_checkins(user_id, limit=90)
    # Return sorted ascending by date (oldest to newest) for chart layouts
    return sorted(docs, key=lambda x: x["date"])

@router.get("/daily-checkin/pdf")
async def export_monthly_pdf(
    current_user: dict = Depends(get_current_user),
    repo: DailyWellnessRepository = Depends(get_daily_wellness_repository),
    service: DailyWellnessService = Depends(get_daily_wellness_service)
) -> StreamingResponse:
    user_id = str(current_user["_id"])
    user_email = current_user.get("email", "user@example.com")
    
    # Load all logs
    history = await repo.list_checkins(user_id, limit=100)
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No daily check-in records found to export."
        )

    current_date = datetime.utcnow().date()
    current_streak, longest_streak, total_checkins = service.calculate_streaks(history, current_date)
    
    # Calculate stats
    avg_score = sum(h["wellness_score"] for h in history) / len(history)
    stats = {
        "avg_score": avg_score,
        "longest_streak": longest_streak,
        "total_checkins": total_checkins
    }
    
    month_name = datetime.utcnow().strftime("%B %Y")
    
    # Simple static monthly summary context or fetch latest AI report overview
    latest_summary = history[0].get("ai_summary", "Prioritizing self-reflection and hydration routines.")

    pdf_stream = MonthlyPDFGenerator.generate_report(
        user_email,
        month_name,
        history,
        latest_summary,
        stats
    )

    filename = f"MindCare_Report_{datetime.utcnow().strftime('%Y_%m')}.pdf"
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
