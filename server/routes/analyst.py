from fastapi import APIRouter, Depends, HTTPException
from auth.routes import get_current_user
from services.application_service import ApplicationService
from services.document_verification import DocumentVerificationService
from models import RequestInfoRequest, MarkReadyRequest, UserRole
from config.db import applications_collection, documents_collection, db, messages_collection
from datetime import datetime
import uuid
from bson import ObjectId
import gridfs

router = APIRouter()

@router.get("/dashboard")
async def get_analyst_dashboard(user=Depends(get_current_user)):
    """Get analyst dashboard data"""
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    try:
        dashboard_data = ApplicationService.get_analyst_applications()
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/applications")
async def get_submitted_applications(user=Depends(get_current_user)):
    """Get all submitted applications"""
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    try:
        dashboard_data = ApplicationService.get_analyst_applications()
        return {"applications": dashboard_data["submitted_applications"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/applications/{application_id}")
async def get_application_details(
    application_id: str,
    user=Depends(get_current_user)
):
    """Get application details for review"""
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    try:
        details = ApplicationService.get_application_details(
            application_id, UserRole.ANALYST
        )
        return details
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/applications/{application_id}/request-info")
async def request_additional_information(
    application_id: str,
    request_data: RequestInfoRequest,
    user=Depends(get_current_user)
):
    """Request additional information from customer"""
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    try:
        result = ApplicationService.request_info_from_customer(
            application_id,
            request_data.message,
            user["username"]
        )
        
        if result:
            return {"message": "Information request sent to customer"}
        else:
            raise HTTPException(status_code=404, detail="Application not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/applications/{application_id}/mark-ready")
async def mark_ready_for_underwriter(
    application_id: str,
    mark_data: MarkReadyRequest,
    user=Depends(get_current_user)
):
    """Mark application as ready for underwriter review"""
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    try:
        result = ApplicationService.mark_analyst_review_complete(
            application_id,
            user["username"],
            mark_data.input_ready
        )
        
        if result:
            return {"message": "Application marked as ready for underwriter review"}
        else:
            raise HTTPException(status_code=404, detail="Application not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/applications/{application_id}/verify-document")
async def verify_application_document(
    application_id: str,
    user=Depends(get_current_user)
):
    """
    Verify application documents using LLM-based extraction and cross-checking
    """
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    try:
        # Get application
        application = applications_collection.find_one({"id": application_id})
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Get the most recent document for this application
        document = documents_collection.find_one(
            {"application_id": application_id},
            sort=[("uploaded_at", -1)]
        )
        if not document:
            return {
                "success": False,
                "message": "No document found for verification",
                "verification_results": None
            }
        
        # Retrieve document content
        file_content = None
        
        # 1) If legacy inline content exists, use it
        if document.get("content"):
            file_content = document["content"]
        else:
            # 2) Try GridFS using file_id (string or ObjectId)
            fs = gridfs.GridFS(db)
            file_id = document.get("file_id")
            if file_id:
                try:
                    # Convert string to ObjectId if needed
                    fid = ObjectId(file_id) if isinstance(file_id, str) else file_id
                    grid_file = fs.get(fid)
                    file_content = grid_file.read()
                except Exception as e:
                    print(f"Warning: Could not retrieve document from GridFS: {str(e)}")
        
        # 3) Final fallback to mock content for testing
        if not file_content:
            file_content = b"Mock document content for testing purposes"
            print(f"Warning: No retrievable content for document {document.get('_id')}, using mock content")
        
        # Extract information from document using LLM/OCR
        extracted_info = DocumentVerificationService.extract_document_info(
            file_content,
            document["filename"],
            document["content_type"]
        )
        
        # Cross-check with application data
        verification_results = DocumentVerificationService.cross_check_information(
            application["data"],
            extracted_info
        )
        
        # Generate summary
        verification_summary = DocumentVerificationService.generate_verification_summary(
            verification_results
        )
        
        # Store verification results in application
        applications_collection.update_one(
            {"id": application_id},
            {
                "$set": {
                    "verification_data": {
                        "extracted_info": extracted_info,
                        "verification_results": verification_results,
                        "verification_summary": verification_summary,
                        "verified_by": user["username"],
                        "verified_at": datetime.now()
                    },
                    "updated_at": datetime.now()
                }
            }
        )
        
        # Create audit event
        from config.db import audit_events_collection
        import uuid
        audit_id = f"AUDIT-{str(uuid.uuid4())[:8].upper()}"
        audit_events_collection.insert_one({
            "id": audit_id,
            "application_id": application_id,
            "action": "document_verified",
            "actor_role": "analyst",
            "actor_id": user["username"],
            "details": f"Document verification completed. Status: {verification_results['overall_status']}",
            "created_at": datetime.now()
        })
        
        return {
            "success": True,
            "message": "Document verification completed",
            "extracted_info": extracted_info,
            "verification_results": verification_results,
            "verification_summary": verification_summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error verifying document: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error verifying document: {str(e)}")


@router.post("/applications/{application_id}/approve")
async def approve_application(
    application_id: str,
    user=Depends(get_current_user)
):
    """
    Approve application after verification - moves to underwriter queue
    """
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    try:
        # Get application
        application = applications_collection.find_one({"id": application_id})
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Check if document verification was done
        verification_data = application.get("verification_data")
        if not verification_data:
            return {
                "success": False,
                "message": "Please verify documents before approving"
            }
        
        # Update application status
        applications_collection.update_one(
            {"id": application_id},
            {
                "$set": {
                    "status": "analyst_approved",
                    "state": "underwriter_review",
                    "analyst_id": user["username"],
                    "analyst_approved_at": datetime.now(),
                    "updated_at": datetime.now()
                }
            }
        )
        
        # Create audit event
        from config.db import audit_events_collection
        audit_id = f"AUDIT-{str(uuid.uuid4())[:8].upper()}"
        audit_events_collection.insert_one({
            "id": audit_id,
            "application_id": application_id,
            "action": "analyst_approved",
            "actor_role": "analyst",
            "actor_id": user["username"],
            "details": f"Application approved by analyst {user['username']} and moved to underwriter queue",
            "created_at": datetime.now()
        })
        # Notify customer
        try:
            from config.db import messages_collection
            msg_id = ApplicationService.generate_id("MSG")
            messages_collection.insert_one({
                "id": msg_id,
                "application_id": application_id,
                "from_role": "analyst",
                "to_role": "customer",
                "body": "Your application has been validated by the analyst and sent to underwriting for final review.",
                "created_at": datetime.now()
            })
        except Exception as e:
            print(f"Warning: failed to insert analyst approval message: {e}")
        
        return {
            "success": True,
            "message": "Application approved and sent to underwriter",
            "application_id": application_id,
            "status": "analyst_approved"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error approving application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error approving application: {str(e)}")


@router.post("/applications/{application_id}/reject")
async def reject_application(
    application_id: str,
    reason: str,
    user=Depends(get_current_user)
):
    """
    Reject application with reason
    """
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    try:
        # Get application
        application = applications_collection.find_one({"id": application_id})
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Update application status
        applications_collection.update_one(
            {"id": application_id},
            {
                "$set": {
                    "status": "rejected",
                    "state": "closed",
                    "rejection_reason": reason,
                    "analyst_id": user["username"],
                    "rejected_at": datetime.now(),
                    "updated_at": datetime.now()
                }
            }
        )
        
        # Create audit event
        from config.db import audit_events_collection
        audit_id = f"AUDIT-{str(uuid.uuid4())[:8].upper()}"
        audit_events_collection.insert_one({
            "id": audit_id,
            "application_id": application_id,
            "action": "analyst_rejected",
            "actor_role": "analyst",
            "actor_id": user["username"],
            "details": f"Application rejected by analyst. Reason: {reason}",
            "created_at": datetime.now()
        })

        # Notify customer via message
        try:
            msg_id = ApplicationService.generate_id("MSG")
            app = applications_collection.find_one({"id": application_id})
            customer_id = app.get("customer_id") if app else None
            if customer_id:
                messages_collection.insert_one({
                    "id": msg_id,
                    "application_id": application_id,
                    "from_role": "analyst",
                    "to_role": "customer",
                    "body": f"Your application was rejected. Reason: {reason}",
                    "created_at": datetime.now()
                })
        except Exception as e:
            # Non-blocking: log and continue
            print(f"Warning: failed to insert customer rejection message: {e}")
        
        return {
            "success": True,
            "message": "Application rejected",
            "application_id": application_id,
            "status": "rejected"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error rejecting application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error rejecting application: {str(e)}")
