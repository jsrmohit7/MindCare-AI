from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from services.auth import get_current_user
from api.dependencies import get_admin_service
from services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Operations & Administration"])

async def verify_admin_privilege(current_user: dict = Depends(get_current_user)):
    """Verifies that the logged in user has administrative privileges."""
    role = current_user.get("role", "user")
    # For testing and demo purposes, allow users with 'admin' role or 'admin' in email
    if role != "admin" and "admin" not in current_user.get("email", ""):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Administrative privilege required."
        )
    return current_user

@router.get("/metrics", response_model=Dict[str, Any])
async def get_admin_metrics_api(
    admin_user: dict = Depends(verify_admin_privilege),
    service: AdminService = Depends(get_admin_service)
):
    """Aggregates active users engagement logs and system latencies."""
    return await service.get_anonymous_metrics()

@router.get("/health", response_model=Dict[str, Any])
async def get_system_health_api(
    admin_user: dict = Depends(verify_admin_privilege),
    service: AdminService = Depends(get_admin_service)
):
    """Gathers runtime health levels of services and infrastructures."""
    return await service.get_system_health()
