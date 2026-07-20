from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from config.database import get_database
from schemas.questionnaire import QuestionnaireCreate, QuestionnaireUpdate, QuestionnaireResponse
from services.auth import get_current_user

router = APIRouter(tags=["Questionnaire"])

@router.post("", response_model=QuestionnaireResponse, status_code=status.HTTP_201_CREATED)
async def create_questionnaire(data: QuestionnaireCreate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # Calculate totals
    phq_total = sum([getattr(data.phq9, f"q{i}") for i in range(1, 10)])
    gad_total = sum([getattr(data.gad7, f"q{i}") for i in range(1, 8)])
    
    # Mutate schemas to include calculated totals
    phq_dict = data.phq9.model_dump()
    phq_dict["total_score"] = phq_total
    
    gad_dict = data.gad7.model_dump()
    gad_dict["total_score"] = gad_total
    
    doc = {
        "user_id": str(current_user["_id"]),
        "personal_info": data.personal_info.model_dump(),
        "phq9": phq_dict,
        "gad7": gad_dict,
        "stress": [q.model_dump() for q in data.stress],
        "sleep": data.sleep.model_dump(),
        "lifestyle": data.lifestyle.model_dump(),
        "wellbeing": data.wellbeing.model_dump(),
        "status": data.status.lower().strip(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    result = await db.questionnaires.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc

@router.get("/me", response_model=QuestionnaireResponse)
async def get_latest_questionnaire(current_user: dict = Depends(get_current_user)):
    db = get_database()
    doc = await db.questionnaires.find_one(
        {"user_id": str(current_user["_id"])},
        sort=[("created_at", -1)]
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questionnaire found for current user"
        )
    return doc

@router.get("/history", response_model=List[QuestionnaireResponse])
async def get_questionnaire_history(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.questionnaires.find({"user_id": str(current_user["_id"])}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    return docs

@router.put("/{id}", response_model=QuestionnaireResponse)
async def update_questionnaire(id: str, data: QuestionnaireUpdate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid questionnaire ID format"
        )
        
    existing = await db.questionnaires.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found"
        )
        
    if existing["user_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this questionnaire"
        )
        
    update_data = {}
    if data.personal_info is not None:
        update_data["personal_info"] = data.personal_info.model_dump()
        
    if data.phq9 is not None:
        phq_total = sum([getattr(data.phq9, f"q{i}") for i in range(1, 10)])
        phq_dict = data.phq9.model_dump()
        phq_dict["total_score"] = phq_total
        update_data["phq9"] = phq_dict
        
    if data.gad7 is not None:
        gad_total = sum([getattr(data.gad7, f"q{i}") for i in range(1, 8)])
        gad_dict = data.gad7.model_dump()
        gad_dict["total_score"] = gad_total
        update_data["gad7"] = gad_dict
        
    if data.stress is not None:
        update_data["stress"] = [q.model_dump() for q in data.stress]
        
    if data.sleep is not None:
        update_data["sleep"] = data.sleep.model_dump()
        
    if data.lifestyle is not None:
        update_data["lifestyle"] = data.lifestyle.model_dump()
        
    if data.wellbeing is not None:
        update_data["wellbeing"] = data.wellbeing.model_dump()
        
    if data.status is not None:
        update_data["status"] = data.status.lower().strip()
        
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.questionnaires.update_one({"_id": obj_id}, {"$set": update_data})
        
    updated = await db.questionnaires.find_one({"_id": obj_id})
    return updated

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_questionnaire(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid questionnaire ID format"
        )
        
    existing = await db.questionnaires.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found"
        )
        
    if existing["user_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this questionnaire"
        )
        
    await db.questionnaires.delete_one({"_id": obj_id})
    return
