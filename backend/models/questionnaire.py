from datetime import datetime
from typing import Optional, Annotated, List
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class QuestionnaireInDB(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: PyObjectId
    personal_info: dict
    phq9: dict
    gad7: dict
    stress: List[dict]
    sleep: dict
    lifestyle: dict
    wellbeing: dict
    status: str = "submitted"  # draft or submitted
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }
