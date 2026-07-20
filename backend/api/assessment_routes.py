from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, Optional
from bson import ObjectId

from models.request_models import AssessmentRequest
from models.response_models import AssessmentResponse, AssessmentListResponse
from api.dependencies import get_assessment_service
from services.assessment_service import AssessmentService
from services.response_validator import GraniteValidationError

router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
)


@router.get(
    "/health",
    summary="Router health check",
    description="Confirm that the assessment API router process is running.",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Assessment API router is healthy"},
        500: {"description": "Internal server error"}
    }
)
def assessment_health() -> Dict[str, str]:
    """
    Simpler health endpoint that confirms the router is active without DB or AI service connections.
    """
    return {"status": "ok"}


@router.post(
    "",
    summary="Create a new assessment",
    description="Calculates risk profile and generates AI assessment from questionnaire answers.",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"model": AssessmentResponse, "description": "Assessment created successfully"},
        400: {"description": "Invalid questionnaire answers or validation failure"},
        422: {"description": "Unprocessable Entity / Validation Error"},
        500: {"description": "Internal server error"}
    }
)
async def create_assessment(
    request: AssessmentRequest,
    assessment_service: AssessmentService = Depends(get_assessment_service)
) -> Dict[str, Any]:
    try:
        answers = request.model_dump()
        return await assessment_service.create_assessment(answers)
    except GraniteValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get(
    "/{assessment_id}",
    summary="Retrieve an assessment",
    description="Retrieves a single mental health assessment by its MongoDB ObjectId.",
    response_model=AssessmentResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {"model": AssessmentResponse, "description": "Assessment retrieved successfully"},
        400: {"description": "Invalid ID format"},
        404: {"description": "Assessment not found"},
        500: {"description": "Internal server error"}
    }
)
async def get_assessment(
    assessment_id: str,
    assessment_service: AssessmentService = Depends(get_assessment_service)
) -> Dict[str, Any]:
    if not ObjectId.is_valid(assessment_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid assessment ID format"
        )

    doc = await assessment_service.get_assessment(assessment_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )

    return doc


@router.get(
    "",
    summary="List recent assessments",
    description="Lists recent assessments in descending order of creation, up to the specified limit.",
    response_model=AssessmentListResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {"model": AssessmentListResponse, "description": "Assessments retrieved successfully"},
        422: {"description": "Validation Error"},
        500: {"description": "Internal server error"}
    }
)
async def list_assessments(
    limit: int = Query(default=20, ge=1, le=100),
    assessment_service: AssessmentService = Depends(get_assessment_service)
) -> Dict[str, Any]:
    docs = await assessment_service.list_assessments(limit=limit)
    return {"assessments": docs}


@router.delete(
    "/{assessment_id}",
    summary="Delete an assessment",
    description="Deletes a mental health assessment by its MongoDB ObjectId.",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Assessment deleted successfully"},
        400: {"description": "Invalid ID format"},
        404: {"description": "Assessment not found"},
        500: {"description": "Internal server error"}
    }
)
async def delete_assessment(
    assessment_id: str,
    assessment_service: AssessmentService = Depends(get_assessment_service)
) -> None:
    if not ObjectId.is_valid(assessment_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid assessment ID format"
        )

    deleted = await assessment_service.delete_assessment(assessment_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )

    return None
