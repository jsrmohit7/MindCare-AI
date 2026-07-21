from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from datetime import date
from services.auth import get_current_user
from api.dependencies import get_monthly_review_repository, get_monthly_review_service
from repositories.monthly_review_repository import MonthlyReviewRepository
from services.monthly_review_service import MonthlyReviewService

router = APIRouter(prefix="/monthly-review", tags=["Monthly AI Reviews"])

@router.get("", response_model=Dict[str, Any])
async def get_monthly_review_api(
    month: Optional[str] = Query(None, description="Month format YYYY-MM, defaults to current month"),
    current_user: dict = Depends(get_current_user),
    repo: MonthlyReviewRepository = Depends(get_monthly_review_repository),
    service: MonthlyReviewService = Depends(get_monthly_review_service)
):
    user_id = str(current_user["_id"])
    target_month = month or date.today().strftime("%Y-%m-%d")[:7] # YYYY-MM

    # Fetch cached review
    review = await repo.get_monthly_review(user_id, target_month)
    if not review:
        # If cache miss, generate review on-the-fly and cache it
        review = await service.generate_monthly_review(user_id, target_month)
        
    return review

@router.get("/history", response_model=List[Dict[str, Any]])
async def list_monthly_reviews_api(
    current_user: dict = Depends(get_current_user),
    repo: MonthlyReviewRepository = Depends(get_monthly_review_repository)
):
    """Retrieves all past monthly reviews generated for the user."""
    user_id = str(current_user["_id"])
    return await repo.list_monthly_reviews(user_id)
