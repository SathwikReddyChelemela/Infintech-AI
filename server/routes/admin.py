from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from typing import List, Dict, Any
import uuid
from datetime import datetime
from auth.routes import get_current_user
from models import CreateUserRequest
from auth.jwt_utils import get_password_hash
from routes.support import load_vectorstore

router = APIRouter()

@router.get("/dashboard")
async def admin_dashboard(user=Depends(get_current_user)):
    """Admin dashboard with users, applications, and system stats"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this dashboard")
    
    try:
        from config.db import applications_collection, users_collection, audit_events_collection, client

        # Users: fetch and normalize
        raw_users = list(users_collection.find({}))
        users = []
        for u in raw_users:
            users.append({
                "id": str(u.get("_id", u.get("username"))),
                "username": u.get("username"),
                "role": u.get("role"),
                "name": u.get("name") or u.get("username"),
                "email": u.get("email") or "",
                "created_at": u.get("created_at") or datetime.now()
            })

        # Applications: fetch and sanitize
        raw_apps = list(applications_collection.find({}))
        applications = []
        for a in raw_apps:
            a = dict(a)
            a.pop("_id", None)
            applications.append(a)

        # System stats
        total_applications = len(applications)
        total_users = len(users)
        total_audit_events = audit_events_collection.count_documents({})

        # Application status distribution (cover new statuses)
        def count_status(s):
            return applications_collection.count_documents({"status": s})
        application_stats = {
            "submitted": count_status("submitted"),
            "analyst_approved": count_status("analyst_approved"),
            "under_review": count_status("under_review"),
            "approved": count_status("approved"),
            "rejected": count_status("rejected"),
            "declined": count_status("declined"),
            "pending_more_info": count_status("pending_more_info"),
            "draft": count_status("draft")
        }

        # User distribution by role
        def count_role(r):
            return users_collection.count_documents({"role": r})
        user_stats = {
            "customers": count_role("customer"),
            "analysts": count_role("analyst"),
            "underwriters": count_role("underwriter"),
            "admins": count_role("admin"),
            "auditors": count_role("auditor")
        }

        # Build system health (MongoDB ping + high-level metrics)
        db_ok = True
        db_error = None
        try:
            client.admin.command('ping')
        except Exception as e:
            db_ok = False
            db_error = str(e)

        system_health = {
            "status": "Healthy" if db_ok else "Degraded",
            "database": {
                "connected": db_ok,
                "error": db_error
            },
            "metrics": {
                "users": total_users,
                "applications": total_applications,
                "audit_events": total_audit_events
            },
            "timestamp": datetime.utcnow().isoformat()
        }

        return {
            "users": users,
            "applications": applications,
            "system_stats": {
                "total_applications": total_applications,
                "total_users": total_users,
                "total_audit_events": total_audit_events
            },
            "application_stats": application_stats,
            "user_stats": user_stats,
            "system_health": system_health
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching admin dashboard: {str(e)}")

@router.get("/users")
async def list_users(user=Depends(get_current_user)):
    """List all users (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can list users")
    try:
        from config.db import users_collection
        from datetime import datetime
        raw_users = list(users_collection.find({}))
        users = []
        for u in raw_users:
            users.append({
                "id": str(u.get("_id", u.get("username"))),
                "username": u.get("username"),
                "role": u.get("role"),
                "name": u.get("name") or u.get("username"),
                "email": u.get("email") or "",
                "created_at": u.get("created_at") or datetime.now()
            })
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing users: {str(e)}")

@router.post("/users")
async def create_user(req: CreateUserRequest, user=Depends(get_current_user)):
    """Create a new user (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create users")
    try:
        from config.db import users_collection
        if users_collection.find_one({"username": req.username}):
            raise HTTPException(status_code=400, detail="User already exists")
        users_collection.insert_one({
            "username": req.username,
            "password": get_password_hash(req.password),
            "role": req.role,
            "name": req.name,
            "email": req.email
        })
        return {"message": "User created successfully", "user": {
            "username": req.username,
            "role": req.role,
            "name": req.name,
            "email": req.email
        }}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@router.patch("/users/{username}/role")
async def update_user_role(username: str, role: str = Form(...), user=Depends(get_current_user)):
    """Update a user's role (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update roles")
    try:
        from config.db import users_collection
        valid_roles = ["customer", "analyst", "underwriter", "admin", "auditor"]
        if role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
        res = users_collection.update_one({"username": username}, {"$set": {"role": role}})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        user_doc = users_collection.find_one({"username": username})
        return {"message": "Role updated", "user": {
            "username": user_doc.get("username"),
            "role": user_doc.get("role"),
            "name": user_doc.get("name"),
            "email": user_doc.get("email")
        }}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating role: {str(e)}")

@router.get("/reports/summary")
async def get_reports_summary(user=Depends(get_current_user)):
    """Return summary metrics for reports (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view reports")
    try:
        from config.db import applications_collection, users_collection
        # Aggregate application stats
        def count_status(s):
            return applications_collection.count_documents({"status": s})
        app_stats = {
            "draft": count_status("draft"),
            "submitted": count_status("submitted"),
            "analyst_approved": count_status("analyst_approved"),
            "under_review": count_status("under_review"),
            "approved": count_status("approved"),
            "rejected": count_status("rejected"),
            "declined": count_status("declined"),
            "pending_more_info": count_status("pending_more_info")
        }
        # User distribution
        def count_role(r):
            return users_collection.count_documents({"role": r})
        user_stats = {
            "customers": count_role("customer"),
            "analysts": count_role("analyst"),
            "underwriters": count_role("underwriter"),
            "admins": count_role("admin"),
            "auditors": count_role("auditor")
        }
        return {"application_stats": app_stats, "user_stats": user_stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building summary report: {str(e)}")

@router.get("/reports/export")
async def export_reports(format: str = "csv", user=Depends(get_current_user)):
    """Export summary metrics (csv)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can export reports")
    try:
        summary = await get_reports_summary(user)  # reuse
        if format != "csv":
            return summary
        # Build CSV string
        lines = ["metric,category,value"]
        for k, v in summary["application_stats"].items():
            lines.append(f"application_status,{k},{v}")
        for k, v in summary["user_stats"].items():
            lines.append(f"user_role,{k},{v}")
        csv_data = "\n".join(lines)
        from fastapi.responses import Response
        return Response(content=csv_data, media_type="text/csv", headers={
            "Content-Disposition": "attachment; filename=summary_report.csv"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting report: {str(e)}")

@router.post("/upload-documents")
async def upload_knowledge_documents(
    user=Depends(get_current_user),
    files: List[UploadFile] = File(...),
    role: str = Form(...),
    description: str = Form(default="")
):
    """Upload documents for knowledge base (local storage, no external vector DB)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can upload knowledge documents")
    
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Validate role
    valid_roles = ["customer", "analyst", "underwriter", "admin", "auditor", "general"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    try:
        # Generate unique document ID
        doc_id = str(uuid.uuid4())
        
        # Load documents into vector store
        await load_vectorstore(files, role, doc_id)
        
        # Log the document upload
        from config.db import audit_events_collection
        from datetime import datetime
        
        # Create audit event
        import uuid
        audit_id = f"AUDIT-{str(uuid.uuid4())[:8].upper()}"
        audit_event = {
            "id": audit_id,
            "action": "document_upload",
            "admin_username": user["username"],
            "document_id": doc_id,
            "role_access": role,
            "file_count": len(files),
            "file_names": [file.filename for file in files],
            "description": description,
            "created_at": datetime.utcnow()
        }
        
        audit_events_collection.insert_one(audit_event)
        
        return {
            "message": f"Successfully uploaded {len(files)} document(s) to knowledge base",
            "document_id": doc_id,
            "role_access": role,
            "files": [file.filename for file in files]
        }
        
    except Exception as e:
        print(f"Error uploading documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/knowledge-documents")
async def list_knowledge_documents(user=Depends(get_current_user)):
    """List all uploaded knowledge documents"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view knowledge documents")
    
    try:
        from config.db import audit_events_collection
        
        # Get all document upload events
        document_uploads = list(audit_events_collection.find(
            {"action": "document_upload"},
            sort=[("created_at", -1)]
        ))
        
        # Convert ObjectIds to strings
        for doc in document_uploads:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
        
        return {
            "documents": document_uploads,
            "total": len(document_uploads)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")

@router.delete("/knowledge-documents/{document_id}")
async def delete_knowledge_document(document_id: str, user=Depends(get_current_user)):
    """Delete a knowledge document (admin only)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete knowledge documents")
    
    try:
        from config.db import audit_events_collection
        
        # Find the document upload record
        doc_record = audit_events_collection.find_one({"document_id": document_id})
        if not doc_record:
            raise HTTPException(status_code=404, detail="Document not found")
        
    # Note: In local-only mode, no external vector deletion is required
        
        # Log the deletion
        audit_id = f"AUDIT-{str(uuid.uuid4())[:8].upper()}"
        audit_event = {
            "id": audit_id,
            "action": "document_delete",
            "admin_username": user["username"],
            "document_id": document_id,
            "deleted_files": doc_record.get("file_names", []),
            "created_at": datetime.utcnow()
        }
        
        audit_events_collection.insert_one(audit_event)
        
        return {
            "message": f"Document {document_id} deletion logged",
            "note": "Vector store cleanup may be required separately"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")
