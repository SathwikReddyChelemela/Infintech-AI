from fastapi import APIRouter, Depends, HTTPException
from auth.routes import get_current_user
from services.application_service import ApplicationService
from models import RequestInfoRequest, MarkReadyRequest

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
        application_data = ApplicationService.get_application_by_id(application_id)
        if not application_data:
            raise HTTPException(status_code=404, detail="Application not found")
        
        return {"application": application_data}
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
