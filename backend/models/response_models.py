from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Dict, List


class AIAnalysisResponseSchema(BaseModel):
    summary: str
    risk_assessment: str
    recommendations: List[str]
    follow_up: str
    disclaimer: str


class MetadataResponseSchema(BaseModel):
    model: str
    schema_version: str
    generated_at: str


class AssessmentResponse(BaseModel):
    """
    Pydantic response model for a single mental health assessment.
    Maps MongoDB _id to JSON id field during serialization.
    """
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )

    id: str = Field(..., validation_alias="_id", serialization_alias="id")
    risk_profile: Dict[str, Any]
    ai_analysis: AIAnalysisResponseSchema
    metadata: MetadataResponseSchema


class AssessmentListResponse(BaseModel):
    """
    Pydantic response model wrapping a list of mental health assessments.
    """
    assessments: List[AssessmentResponse]
