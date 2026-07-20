from datetime import datetime
from typing import Optional, Annotated
from pydantic import BaseModel, Field, EmailStr, BeforeValidator, field_validator

PyObjectId = Annotated[str, BeforeValidator(str)]

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    role: str = Field(..., description="Role must be: patient, doctor, admin")
    age: Optional[int] = Field(None, ge=0, le=120)
    gender: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in ["patient", "doctor", "admin"]:
            raise ValueError("Role must be one of: patient, doctor, admin")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    full_name: str
    email: EmailStr
    role: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }
