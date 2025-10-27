from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from auth.routes import get_current_user
from routes.support import load_vectorstore
import uuid

router = APIRouter()

@router.get("/test")
async def test_docs():
    return {"message": "Docs endpoint is working"}

@router.post("/upload_docs")
async def upload_docs(
    user=Depends(get_current_user),
    file: UploadFile = File(...),
    role: str = Form(...)
):
    print(f"Upload request from user: {user['username']}, role: {user['role']}, file: {file.filename}")
    
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can upload documents")

    try:
        doc_id = str(uuid.uuid4())
        print(f"Generated doc_id: {doc_id}")
        await load_vectorstore([file], role, doc_id)  # ✅ AWAIT here
        print(f"Vectorstore loaded successfully for {file.filename}")
        return {
            "message": f"{file.filename} uploaded successfully",
            "doc_id": doc_id,
            "accessible_to": role
        }
    except Exception as e:
        print(f"Error in upload_docs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
