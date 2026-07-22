from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from services.auth import get_current_user
from services.adaptive_theme_service import AdaptiveThemeService
from api.dependencies import get_database

# Request/Response validation schemas
class ThemeOverrideRequest(BaseModel):
    theme: Optional[str] = Field(
        default=None,
        description="The manual theme override. Use 'happy', 'calm', 'focused', 'stressed', 'anxious', 'low_mood', or null to disable override."
    )

router = APIRouter(tags=["Emotion-Adaptive Theme"])

async def get_adaptive_theme_service(
    db = Depends(get_database)
) -> AdaptiveThemeService:
    # Inline import to avoid circular dependencies
    from repositories.assessment_repository import AssessmentRepository
    from repositories.daily_wellness_repository import DailyWellnessRepository
    from services.ai_orchestrator import AIOrchestrator
    
    return AdaptiveThemeService(
        db=db,
        ai_orchestrator=AIOrchestrator(),
        assessment_repository=AssessmentRepository(db),
        daily_wellness_repository=DailyWellnessRepository(db)
    )

@router.get("/adaptive-theme", response_model=Dict[str, Any])
async def get_adaptive_theme(
    current_user: dict = Depends(get_current_user),
    service: AdaptiveThemeService = Depends(get_adaptive_theme_service)
) -> Dict[str, Any]:
    """
    Returns the active emotion-adaptive state, current theme configuration,
    personal recommendations, and history timeline logs for the logged-in user.
    """
    user_id = str(current_user["_id"])
    try:
        return await service.get_user_theme_state(user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch theme state: {str(e)}"
        )

@router.post("/adaptive-theme/override", response_model=Dict[str, Any])
async def set_theme_override(
    payload: ThemeOverrideRequest,
    current_user: dict = Depends(get_current_user),
    service: AdaptiveThemeService = Depends(get_adaptive_theme_service)
) -> Dict[str, Any]:
    """
    Sets a manual theme override. Set payload value 'theme' to null to restore
    automatic emotion-adaptive mode.
    """
    user_id = str(current_user["_id"])
    valid_themes = ["happy", "calm", "focused", "stressed", "anxious", "low_mood", None]
    if payload.theme not in valid_themes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid theme value. Choose from: {', '.join([str(t) for t in valid_themes if t is not None])}"
        )
    
    try:
        return await service.save_theme_override(user_id, payload.theme)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set theme override: {str(e)}"
        )
