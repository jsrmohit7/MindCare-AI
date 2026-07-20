from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from config.database import get_database
from schemas.user import UserRegister, UserLogin, UserResponse
from services.security import get_password_hash, verify_password, create_access_token
from services.auth import get_current_user

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    db = get_database()
    
    # 1. Normalize email
    email = user_data.email.lower().strip()
    
    # 2. Check for duplicate email
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
        
    # 3. Hash password
    hashed_pwd = get_password_hash(user_data.password)
    
    # 4. Save user
    new_user_dict = {
        "full_name": user_data.full_name,
        "email": email,
        "hashed_password": hashed_pwd,
        "role": user_data.role,
        "age": user_data.age,
        "gender": user_data.gender,
        "phone": user_data.phone,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    try:
        result = await db.users.insert_one(new_user_dict)
        new_user_dict["_id"] = result.inserted_id
        return new_user_dict
    except Exception as exc:
        # Fallback if unique index check catches it concurrent to check
        if "duplicate key error" in str(exc).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not register user"
        )

@router.post("/login")
async def login(credentials: UserLogin):
    db = get_database()
    email = credentials.email.lower().strip()
    
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(credentials.password, user["hashed_password"]):
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
         
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
