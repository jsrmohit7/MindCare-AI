from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DailyCheckInRequest(BaseModel):
    mood: str = Field(..., description="Mood rating (Very Happy, Happy, Neutral, Sad, Very Sad)")
    stress: int = Field(..., ge=1, le=10, description="Stress level (1-10)")
    anxiety: int = Field(..., ge=1, le=10, description="Anxiety level (1-10)")
    sleep: str = Field(..., description="Sleep duration range")
    exercise: bool = Field(..., description="Did the user exercise?")
    exercise_minutes: int = Field(0, ge=0, description="Minutes exercised")
    water: str = Field(..., description="Water intake range")
    meals: str = Field(..., description="Meal consistency status")
    meditation: bool = Field(..., description="Did the user meditate?")
    meditation_minutes: int = Field(0, ge=0, description="Minutes meditated")
    notes: Optional[str] = Field(None, max_length=500, description="Optional personal notes")

class DailyCheckInResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    date: str
    mood: str
    stress: int
    anxiety: int
    sleep: str
    exercise: bool
    exercise_minutes: int
    water: str
    meals: str
    meditation: bool
    meditation_minutes: int
    notes: Optional[str] = None
    wellness_score: int
    ai_summary: Optional[str] = None
    daily_goal: Optional[str] = None
    motivation: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
