from pydantic import BaseModel
from typing import List
from schemas.questionnaire import (
    PersonalInfoSchema,
    PHQ9Schema,
    GAD7Schema,
    StressQuestion,
    SleepSchema,
    LifestyleSchema,
    WellbeingSchema,
)


class AssessmentRequest(BaseModel):
    """
    Pydantic request model for creating a new mental health assessment.
    Replicates the questionnaire structure.
    """
    personal_info: PersonalInfoSchema
    phq9: PHQ9Schema
    gad7: GAD7Schema
    stress: List[StressQuestion]
    sleep: SleepSchema
    lifestyle: LifestyleSchema
    wellbeing: WellbeingSchema
    status: str = "submitted"
