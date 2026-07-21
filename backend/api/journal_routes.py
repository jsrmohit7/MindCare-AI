from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from datetime import date
from services.auth import get_current_user
from api.dependencies import get_journal_repository, get_journal_service
from repositories.journal_repository import JournalRepository
from services.journal_service import JournalService

router = APIRouter(prefix="/journal", tags=["Mood Journal"])

@router.get("", response_model=List[Dict[str, Any]])
async def list_journals_api(
    query: Optional[str] = Query(None, description="Search keyword for content or tags"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    repo: JournalRepository = Depends(get_journal_repository)
):
    user_id = str(current_user["_id"])
    return await repo.list_journals(user_id, limit=limit, skip=skip, query=query)

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_journal_api(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    service: JournalService = Depends(get_journal_service)
):
    user_id = str(current_user["_id"])
    content = payload.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Journal content cannot be empty")
    
    # Get current date or custom date YYYY-MM-DD
    journal_date = payload.get("date", date.today().strftime("%Y-%m-%d"))
    tags = payload.get("tags", [])

    journal_id = await service.create_journal_entry(
        user_id=user_id,
        date_str=journal_date,
        content=content,
        tags=tags
    )
    return {"id": journal_id, "status": "created"}

@router.put("/{journal_id}")
async def update_journal_api(
    journal_id: str,
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    service: JournalService = Depends(get_journal_service)
):
    user_id = str(current_user["_id"])
    content = payload.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Journal content cannot be empty")
    
    tags = payload.get("tags", [])
    success = await service.update_journal_entry(
        user_id=user_id,
        journal_id=journal_id,
        content=content,
        tags=tags
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found or update failed")
    return {"status": "updated"}

@router.delete("/{journal_id}")
async def delete_journal_api(
    journal_id: str,
    current_user: dict = Depends(get_current_user),
    repo: JournalRepository = Depends(get_journal_repository)
):
    user_id = str(current_user["_id"])
    success = await repo.delete_journal(user_id, journal_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")
    return {"status": "deleted"}
