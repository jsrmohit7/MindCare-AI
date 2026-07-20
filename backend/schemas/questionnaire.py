from datetime import datetime
from typing import Optional, Annotated, List
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class PersonalInfoSchema(BaseModel):
    occupation: str
    education: str
    marital_status: str

class PHQ9Schema(BaseModel):
    q1: int = Field(..., ge=0, le=3)
    q2: int = Field(..., ge=0, le=3)
    q3: int = Field(..., ge=0, le=3)
    q4: int = Field(..., ge=0, le=3)
    q5: int = Field(..., ge=0, le=3)
    q6: int = Field(..., ge=0, le=3)
    q7: int = Field(..., ge=0, le=3)
    q8: int = Field(..., ge=0, le=3)
    q9: int = Field(..., ge=0, le=3)
    total_score: Optional[int] = None

class GAD7Schema(BaseModel):
    q1: int = Field(..., ge=0, le=3)
    q2: int = Field(..., ge=0, le=3)
    q3: int = Field(..., ge=0, le=3)
    q4: int = Field(..., ge=0, le=3)
    q5: int = Field(..., ge=0, le=3)
    q6: int = Field(..., ge=0, le=3)
    q7: int = Field(..., ge=0, le=3)
    total_score: Optional[int] = None

class StressQuestion(BaseModel):
    question: str
    answer: int = Field(..., ge=1, le=5)

class SleepSchema(BaseModel):
    duration: float = Field(..., ge=0.0, le=24.0)
    quality: str
    night_awakenings: int = Field(..., ge=0)
    difficulty_falling_asleep: bool

class LifestyleSchema(BaseModel):
    exercise: str
    screen_time: float = Field(..., ge=0.0, le=24.0)
    alcohol: str
    smoking: bool
    water_intake: float = Field(..., ge=0.0)
    diet: str

class WellbeingSchema(BaseModel):
    happiness: int = Field(..., ge=1, le=10)
    energy: int = Field(..., ge=1, le=10)
    motivation: int = Field(..., ge=1, le=10)
    concentration: int = Field(..., ge=1, le=10)
    social_support: str

class QuestionnaireCreate(BaseModel):
    personal_info: PersonalInfoSchema
    phq9: PHQ9Schema
    gad7: GAD7Schema
    stress: List[StressQuestion]
    sleep: SleepSchema
    lifestyle: LifestyleSchema
    wellbeing: WellbeingSchema
    status: str = Field("submitted", description="draft or submitted")

class QuestionnaireUpdate(BaseModel):
    personal_info: Optional[PersonalInfoSchema] = None
    phq9: Optional[PHQ9Schema] = None
    gad7: Optional[GAD7Schema] = None
    stress: Optional[List[StressQuestion]] = None
    sleep: Optional[SleepSchema] = None
    lifestyle: Optional[LifestyleSchema] = None
    wellbeing: Optional[WellbeingSchema] = None
    status: Optional[str] = None

class QuestionnaireResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    personal_info: PersonalInfoSchema
    phq9: PHQ9Schema
    gad7: GAD7Schema
    stress: List[StressQuestion]
    sleep: SleepSchema
    lifestyle: LifestyleSchema
    wellbeing: WellbeingSchema
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }
