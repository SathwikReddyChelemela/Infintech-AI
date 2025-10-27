from fastapi import APIRouter, HTTPException, Depends, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import timedelta
from .models import SignupRequest, LoginRequest
from .jwt_utils import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    verify_token, 
    get_current_user_from_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from config.db import users_collection

router = APIRouter()
security = HTTPBearer()


# Role mapping from old to new roles (for backward compatibility)
def map_role(old_role: str) -> str:
    role_mapping = {
        "doctor": "analyst",
        "nurse": "underwriter", 
        "patient": "customer",
        "other": "auditor",
        "ops": "underwriter",
        "merchant": "auditor",
        "finance officer": "underwriter",
        "insurance agent": "underwriter"
    }
    return role_mapping.get(old_role, old_role)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    token = credentials.credentials
    user_data = get_current_user_from_token(token)
    return user_data

def authenticate(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Authenticate user using JWT token (for backward compatibility)"""
    return get_current_user(credentials)

@router.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    """Login endpoint that returns JWT token"""
    # Find user in database
    user = users_collection.find_one({"username": username})
    if not user or not verify_password(password, user['password']):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Map the role to the new system
    mapped_role = map_role(user["role"])
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": mapped_role}, 
        expires_delta=access_token_expires
    )
    
    user_data = {
        "username": user["username"],
        "role": mapped_role
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
        "role": mapped_role  # For backward compatibility
    }

@router.post("/signup") 
def signup(req: SignupRequest):
    """Signup endpoint to create new user"""
    if users_collection.find_one({"username": req.username}):
        raise HTTPException(status_code=400, detail="User already exists")

    requested_role = map_role(req.role)
    if requested_role == "admin":
        if not req.security_code or req.security_code != "0345":
            raise HTTPException(status_code=403, detail="Invalid or missing admin security code")
    
    users_collection.insert_one({
        "username": req.username,
        "password": get_password_hash(req.password),
        "role": requested_role
    })
    return {"message": "User created successfully"}

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user
    