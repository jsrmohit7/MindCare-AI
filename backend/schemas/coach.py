from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MessageSchema(BaseModel):
    role: str = Field(..., description="Role of message sender (user, assistant, system)")
    content: str = Field(..., description="Content of the message")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ConversationCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=100, description="Optional title of the conversation")

class ConversationRename(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="New title of the conversation")

class ConversationResponse(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    title: str
    messages: List[MessageSchema]
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="The user's message to the AI coach")

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
