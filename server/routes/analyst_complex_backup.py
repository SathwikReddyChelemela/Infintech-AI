from fastapi import APIRouter, Depends, HTTPException, Form
from typing import Dict, Any, List
import os
import json
from datetime import datetime

from auth.routes import get_current_user
from services.application_service import ApplicationService
from models import (
    RequestInfoRequest, MarkReadyRequest, UserRole
)
# Chat module removed; placeholder left intentionally
from config.db import applications_collection, documents_collection
import pypdf
import io

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
async def request_info(
    application_id: str,
    request: RequestInfoRequest,
    user=Depends(get_current_user)
):
    """Request more information from customer"""
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    try:
        message = ApplicationService.request_info(
            application_id, request.message, UserRole.ANALYST, user["username"]
        )
        return {"message": "Info request sent successfully", "message_data": message}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/applications/{application_id}/mark-ready")
async def mark_ready_for_scoring(
    application_id: str,
    request: MarkReadyRequest,
    user=Depends(get_current_user)
):
    """Mark application ready for scoring"""
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    try:
        application = ApplicationService.mark_ready_for_scoring(
            application_id, request.input_ready, UserRole.ANALYST, user["username"]
        )
        # Application marked ready for scoring
        return {"message": "Application marked ready for scoring", "application": application}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data-quality/{application_id}")
async def get_data_quality_report(
    application_id: str,
    user=Depends(get_current_user)
):
    """Get data quality report for application"""
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    try:
        details = ApplicationService.get_application_details(
            application_id, UserRole.ANALYST
        )
        
        # Simple data quality checks
        data = details["application"].data
        quality_report = {
            "application_id": application_id,
            "checks": {
                "personal_info": len(data.personal) > 0,
                "health_info": len(data.health) > 0,
                "financial_info": len(data.financial) > 0,
                "consents": len(data.consents) > 0,
                "attachments": len(data.attachments) > 0
            },
            "missing_fields": [],
            "total_checks": 5,
            "passed_checks": 0
        }
        
        # Count passed checks and identify missing fields
        for check_name, passed in quality_report["checks"].items():
            if passed:
                quality_report["passed_checks"] += 1
            else:
                quality_report["missing_fields"].append(check_name)
        
        return quality_report
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-documents/{application_id}")
async def analyze_customer_documents(
    application_id: str,
    user=Depends(get_current_user)
):
    """Document analysis stub (AI disabled)."""
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")

    try:
        application = applications_collection.find_one({"application_id": application_id})
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")

        documents = list(documents_collection.find({"application_id": application_id}))

        if not documents:
            return {
                "analysis_result": "No documents found for analysis",
                "qualification_status": "insufficient_data",
                "confidence_score": 0,
                "recommendations": ["Upload required financial documents for analysis"],
            }

        ai_response = (
            "Automated AI analysis is disabled in this build. Please perform manual document review."
        )

        qualification_status = "needs_review"
        confidence_score = 75

        analysis_result = {
            "application_id": application_id,
            "analysis_timestamp": datetime.utcnow().isoformat(),
            "analyst": user["username"],
            "documents_analyzed": len(documents),
            "ai_analysis": ai_response,
            "qualification_status": qualification_status,
            "confidence_score": confidence_score,
            "summary": {
                "property_evaluation": "Analyzed based on available documents",
                "net_worth": "Calculated from financial statements",
                "income_analysis": "Reviewed income sources and stability",
                "tax_compliance": "Assessed tax documentation",
                "qualification": qualification_status.replace("_", " ").title(),
            },
            "document_list": [
                {"filename": doc.get("filename", "unknown"), "type": doc.get("type", "unknown")}
                for doc in documents
            ],
        }

        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")

@router.get("/insights/{application_id}")
async def get_application_insights(
    application_id: str,
    user=Depends(get_current_user)
):
    """Get pre-generated insights and analysis for an application"""
    if user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    try:
        # Get application and documents
        application = applications_collection.find_one({"application_id": application_id})
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        documents = list(documents_collection.find({"application_id": application_id}))
        
        # Generate quick insights
        insights = {
            "application_id": application_id,
            "customer_name": application.get("data", {}).get("personal", {}).get("full_name", "Unknown"),
            "application_status": application.get("status", "pending"),
            "documents_count": len(documents),
            "document_types": list(set([doc.get("type", "other") for doc in documents])),
            "completeness_score": 0,
            "risk_indicators": [],
            "positive_factors": [],
            "recommendations": []
        }
        
        # Calculate completeness score
        required_docs = ["financial_statement", "tax_return", "property_document", "income_proof"]
        available_types = [doc.get("type", "") for doc in documents]
        
        completeness_count = sum(1 for req_type in required_docs if req_type in available_types)
        insights["completeness_score"] = (completeness_count / len(required_docs)) * 100
        
        # Add basic insights based on available data
        app_data = application.get("data", {})
        
        if app_data.get("financial"):
            insights["positive_factors"].append("Financial information provided")
        if len(documents) >= 3:
            insights["positive_factors"].append("Multiple supporting documents uploaded")
        else:
            insights["risk_indicators"].append("Limited documentation provided")
        
        if insights["completeness_score"] < 75:
            insights["recommendations"].append("Request additional documentation for complete assessment")
        
        insights["recommendations"].append("Run full document analysis for detailed qualification assessment")
        
        return insights
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
