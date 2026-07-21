from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from services.auth import get_current_user
from api.dependencies import get_activity_repository
from repositories.activity_repository import ActivityRepository

router = APIRouter(prefix="/journey", tags=["Journey Timeline"])

@router.get("", response_model=List[Dict[str, Any]])
async def get_journey_timeline_api(
    filter_range: Optional[str] = Query(None, description="Filter range: today | week | month"),
    current_user: dict = Depends(get_current_user),
    activity_repo: ActivityRepository = Depends(get_activity_repository)
):
    """
    Exposes user activities timeline (Assessments, Check-Ins, Coach Chats, Goals, etc.)
    by querying only the activity_events collection.
    """
    user_id = str(current_user["_id"])
    
    # Retrieve timeline (limit 100 for pagination/performance)
    raw_timeline = await activity_repo.get_user_timeline(user_id, limit=100)

    # Filter based on filter_range
    if not filter_range:
        return raw_timeline

    filtered = []
    now = datetime.utcnow()
    
    for event in raw_timeline:
        event_time = event.get("timestamp")
        # Ensure timestamp is datetime (serializable string might need parsing)
        if isinstance(event_time, str):
            event_time = datetime.fromisoformat(event_time.replace("Z", "+00:00"))
        elif not isinstance(event_time, datetime):
            filtered.append(event)
            continue
            
        if filter_range == "today" and event_time.date() == now.date():
            filtered.append(event)
        elif filter_range == "week" and event_time >= (now - timedelta(days=7)):
            filtered.append(event)
        elif filter_range == "month" and event_time >= (now - timedelta(days=30)):
            filtered.append(event)

    return filtered
