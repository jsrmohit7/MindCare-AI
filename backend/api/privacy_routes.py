from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from services.auth import get_current_user
from api.dependencies import get_privacy_service, get_export_service
from services.privacy_service import PrivacyService
from services.export_service import ExportService

router = APIRouter(tags=["Privacy & Trust"])

@router.get("/privacy/summary", response_model=Dict[str, int])
async def get_privacy_summary_api(
    current_user: dict = Depends(get_current_user),
    service: PrivacyService = Depends(get_privacy_service)
):
    """Returns total volume of data stored for user features."""
    user_id = str(current_user["_id"])
    return await service.get_personal_data_summary(user_id)

@router.delete("/privacy/purge/{category}")
async def purge_selective_data_api(
    category: str,
    current_user: dict = Depends(get_current_user),
    service: PrivacyService = Depends(get_privacy_service)
):
    """Selectively deletes feature data category."""
    user_id = str(current_user["_id"])
    if category == "journals":
        await service.purge_journal(user_id)
    elif category == "goals":
        await service.purge_goals(user_id)
    elif category == "coach":
        await service.purge_coach_history(user_id)
    elif category == "assessments":
        await service.purge_assessments(user_id)
    elif category == "checkins":
        await service.purge_daily_wellness(user_id)
    elif category == "memory":
        await service.purge_ai_memory(user_id)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid purge category: {category}")
    return {"status": "purged", "category": category}

@router.delete("/privacy/account")
async def delete_account_api(
    current_user: dict = Depends(get_current_user),
    service: PrivacyService = Depends(get_privacy_service)
):
    """ GDPR compliance teardown of entire user presence."""
    user_id = str(current_user["_id"])
    await service.delete_account(user_id)
    return {"status": "deleted", "message": "All personal records purged successfully."}

@router.get("/privacy/export", response_model=Dict[str, Any])
async def export_data_api(
    current_user: dict = Depends(get_current_user),
    export_service: ExportService = Depends(get_export_service)
):
    """Compiles and returns user portability dataset archive."""
    user_id = str(current_user["_id"])
    return await export_service.compile_user_archive(user_id)
