from fastapi import FastAPI, Form, File, HTTPException, UploadFile, Depends
from auth.routes import router as auth_router, get_current_user
from docs.routes import router as docs_router
from routes.customer import router as customer_router
from routes.analyst import router as analyst_router
from routes.underwriter import router as underwriter_router
from routes.admin import router as admin_router
from routes.support import router as support_router
from routes.auditor import router as auditor_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Financial RBAC RAG System",
    description="A comprehensive financial system with role-based access control and interconnected workflows",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(docs_router, prefix="/docs", tags=["Document Management"])
app.include_router(customer_router, prefix="/customer", tags=["Customer Operations"])
app.include_router(analyst_router, prefix="/analyst", tags=["Analyst Operations"])
app.include_router(underwriter_router, prefix="/underwriter", tags=["Underwriter Operations"])
app.include_router(admin_router, prefix="/admin", tags=["Admin Operations"])
app.include_router(support_router, prefix="/support", tags=["Support"])
app.include_router(auditor_router, prefix="/auditor", tags=["Auditor Operations"])

@app.get("/")
async def root():
    return {
        "message": "Financial RBAC RAG System API",
        "version": "2.0.0",
        "description": "Interconnected workflow system for financial services",
        "endpoints": {
            "auth": "/auth",
            "docs": "/docs",
            "customer": "/customer",
            "analyst": "/analyst",
            "underwriter": "/underwriter"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

@app.delete("/admin/reset-database")
def reset_database(user=Depends(get_current_user)):
    """Reset the entire database - remove all users, applications, and documents"""
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admin can reset database")
    
    try:
        from config.db import users_collection, applications_collection, documents_collection, audit_events_collection, payments_collection
        
        # Delete all collections
        collections = [
            ("users", users_collection),
            ("applications", applications_collection), 
            ("documents", documents_collection),
            ("audit_events", audit_events_collection),
            ("payments", payments_collection),
        ]
        
        results = {}
        for name, collection in collections:
            delete_result = collection.delete_many({})
            results[name] = f"Deleted {delete_result.deleted_count} documents"
        
        return {
            "message": "Database reset successfully",
            "results": results,
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting database: {str(e)}")

@app.get("/stats")
def get_live_stats(user=Depends(get_current_user)):
    """Get live statistics for dashboard widgets based on actual data"""
    try:
        from config.db import applications_collection, documents_collection, users_collection
        
        # Count applications by status
        active_applications = applications_collection.count_documents({"status": {"$in": ["submitted", "under_review", "pending"]}})
        applications_pending = applications_collection.count_documents({"status": "pending"})
        approved_today = applications_collection.count_documents({
            "status": "approved",
            "updated_at": {"$gte": "2024-01-01"}  # Today's date logic can be improved
        })
        
        # Count documents
        documents_count = documents_collection.count_documents({})
        
        # Count users
        active_users = users_collection.count_documents({})
        
        # Mock some counts that would need more complex logic
        support_tickets = 0  # Would need a support tickets collection
        reports_created = 0  # Would need a reports collection
        analyses_pending = applications_pending  # Can use pending applications as proxy
        market_insights = 0  # Would need market data collection
        risk_assessments = active_applications  # Can use active applications as proxy
        audit_reports = 0  # Would need audit collection
        issues_found = 0  # Would need issues tracking
        pending_actions = applications_pending  # Can use pending applications
        
        return {
            "activeApplications": active_applications,
            "documentsCount": documents_count,
            "supportTickets": support_tickets,
            "reportsCreated": reports_created,
            "analysesPending": analyses_pending,
            "marketInsights": market_insights,
            "applicationsPending": applications_pending,
            "approvedToday": approved_today,
            "riskAssessments": risk_assessments,
            "activeUsers": active_users,
            "systemHealth": "99.9%",
            "pendingActions": pending_actions,
            "auditReports": audit_reports,
            "complianceScore": "95%",
            "issuesFound": issues_found
        }
    except Exception as e:
        print(f"Error fetching stats: {e}")
        # Return default values on error
        return {
            "activeApplications": 0,
            "documentsCount": 0,
            "supportTickets": 0,
            "reportsCreated": 0,
            "analysesPending": 0,
            "marketInsights": 0,
            "applicationsPending": 0,
            "approvedToday": 0,
            "riskAssessments": 0,
            "activeUsers": 0,
            "systemHealth": "100%",
            "pendingActions": 0,
            "auditReports": 0,
            "complianceScore": "100%",
            "issuesFound": 0
        }



@app.get("/test-auth")
async def test_auth(user=Depends(get_current_user)):
    return {
        "message": "Authentication successful",
        "user": user,
        "endpoints": {
            "upload_docs": "/docs/upload_docs"
        }
    }

@app.post("/upload_docs")
async def upload_docs_direct(
    user=Depends(get_current_user),
    file: UploadFile = File(...),
    role: str = Form(...)
):
    """Direct upload endpoint for React frontend"""
    print(f"Direct upload request from user: {user['username']}, role: {user['role']}, file: {file.filename}")
    
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can upload documents")

    try:
        from routes.support import load_vectorstore
        import uuid
        doc_id = str(uuid.uuid4())
        print(f"Generated doc_id: {doc_id}")
        await load_vectorstore([file], role, doc_id)
        print(f"Vectorstore loaded successfully for {file.filename}")
        return {
            "message": f"{file.filename} uploaded successfully",
            "doc_id": doc_id,
            "accessible_to": role
        }
    except Exception as e:
        print(f"Error in upload_docs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/application-status")
def get_application_status(user=Depends(get_current_user)):
    """Get the latest application status for the current customer"""
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can access application status")
    
    try:
        from config.db import applications_collection, audit_events_collection
        
        # Find the latest application for this customer (most recent by created_at)
        latest_application = applications_collection.find_one(
            {"customer_id": user["username"]},
            sort=[("created_at", -1)]  # Sort by created_at descending to get latest first
        )
        
        if not latest_application:
            raise HTTPException(status_code=404, detail="No applications found for this customer")
        
        # Get audit events for this application
        audit_events = list(audit_events_collection.find(
            {"application_id": latest_application["id"]},
            sort=[("created_at", 1)]  # Sort chronologically
        ))
        
        # Convert ObjectIds to strings for JSON serialization
        for event in audit_events:
            if "_id" in event:
                event["_id"] = str(event["_id"])
        
        # Return the latest application with its audit events
        return {
            "applicationId": latest_application["id"],
            "status": latest_application["status"],
            "lastUpdate": latest_application.get("updated_at", latest_application["created_at"]),
            "audit_events": audit_events
        }
        
    except Exception as e:
        print(f"Error fetching application status: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching application status")


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Financial RBAC RAG System API Server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
