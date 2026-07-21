from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from services.auth import get_current_user
from api.dependencies import get_coach_repository, get_coach_service
from repositories.coach_repository import CoachRepository
from services.coach_service import CoachService
from schemas.coach import (
    ConversationCreate,
    ConversationRename,
    ConversationResponse,
    ChatRequest,
    ChatResponse
)

router = APIRouter(prefix="/coach", tags=["AI Coach"])

@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    current_user: dict = Depends(get_current_user),
    repo: CoachRepository = Depends(get_coach_repository)
):
    user_id = str(current_user["_id"])
    title = payload.title or "New Chat"
    conv = await repo.create_conversation(user_id, title)
    return conv

@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    repo: CoachRepository = Depends(get_coach_repository)
):
    user_id = str(current_user["_id"])
    conversations = await repo.list_conversations(user_id, search_query=search)
    return conversations

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    repo: CoachRepository = Depends(get_coach_repository)
):
    user_id = str(current_user["_id"])
    conv = await repo.get_conversation(user_id, conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return conv

@router.put("/conversations/{conversation_id}/rename", response_model=ConversationResponse)
async def rename_conversation(
    conversation_id: str,
    payload: ConversationRename,
    current_user: dict = Depends(get_current_user),
    repo: CoachRepository = Depends(get_coach_repository)
):
    user_id = str(current_user["_id"])
    conv = await repo.rename_conversation(user_id, conversation_id, payload.title)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return conv

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    repo: CoachRepository = Depends(get_coach_repository)
):
    user_id = str(current_user["_id"])
    success = await repo.delete_conversation(user_id, conversation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return None

@router.post("/conversations/{conversation_id}/chat", response_model=ChatResponse)
async def chat_message(
    conversation_id: str,
    payload: ChatRequest,
    current_user: dict = Depends(get_current_user),
    service: CoachService = Depends(get_coach_service)
):
    user_id = str(current_user["_id"])
    user_name = current_user.get("full_name", "User")
    
    try:
        response_text = await service.generate_response(
            user_id=user_id,
            user_name=user_name,
            conversation_id=conversation_id,
            user_message=payload.message
        )
        return ChatResponse(
            response=response_text,
            conversation_id=conversation_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while generating AI response: {e}"
        )
