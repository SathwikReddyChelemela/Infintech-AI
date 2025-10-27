from fastapi import APIRouter, HTTPException

# Chat routes disabled. This file remains to avoid import errors if referenced accidentally.
router = APIRouter()

@router.get("/test")
async def test_chat_disabled():
    raise HTTPException(status_code=410, detail="Chat feature is removed")

@router.post("/chat")
async def chat_disabled():
    raise HTTPException(status_code=410, detail="Chat feature is removed")