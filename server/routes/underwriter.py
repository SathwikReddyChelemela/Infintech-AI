from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from datetime import datetime

from auth.routes import get_current_user
from services.application_service import ApplicationService
from models import (
    DecisionRequest, UserRole
)

router = APIRouter()

@router.get("/dashboard")
async def get_underwriter_dashboard(user=Depends(get_current_user)):
    """Get underwriter dashboard data"""
    if user["role"] != "underwriter":
        raise HTTPException(status_code=403, detail="Underwriter access required")
    
    try:
        dashboard_data = ApplicationService.get_underwriter_applications()
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/case-queue")
async def get_case_queue(user=Depends(get_current_user)):
    """Get case queue for underwriter"""
    if user["role"] != "underwriter":
        raise HTTPException(status_code=403, detail="Underwriter access required")
    
    try:
        dashboard_data = ApplicationService.get_underwriter_applications()
        return {"case_queue": dashboard_data["case_queue"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/applications/{application_id}")
async def get_application_details(
    application_id: str,
    user=Depends(get_current_user)
):
    """Get application details for decision making"""
    if user["role"] != "underwriter":
        raise HTTPException(status_code=403, detail="Underwriter access required")
    
    try:
        details = ApplicationService.get_application_details(
            application_id, UserRole.UNDERWRITER
        )
        return details
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/applications/{application_id}/decision")
async def make_decision(
    application_id: str,
    request: DecisionRequest,
    user=Depends(get_current_user)
):
    """Make decision on application"""
    if user["role"] != "underwriter":
        raise HTTPException(status_code=403, detail="Underwriter access required")
    
    try:
        application = ApplicationService.make_decision(
            application_id=application_id,
            decision=request.decision,
            reason=request.reason,
            premium_amount=request.premium_amount,
            actor_role=UserRole.UNDERWRITER,
            actor_id=user["username"]
        )
        # Notify customer about decision
        try:
            from config.db import messages_collection
            msg_id = ApplicationService.generate_id("MSG")
            status_text = "approved" if request.decision == "approve" else ("declined" if request.decision == "decline" else "pended for review")
            body = f"Your application has been {status_text} by the underwriter. Reason: {request.reason}"
            messages_collection.insert_one({
                "id": msg_id,
                "application_id": application_id,
                "from_role": "underwriter",
                "to_role": "customer",
                "body": body,
                "created_at": datetime.now()
            })
        except Exception as e:
            print(f"Warning: failed to insert underwriter decision message: {e}")
        # Decision made successfully
        return {"message": "Decision made successfully", "application": application}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/risk-assessment/{application_id}")
async def get_risk_assessment(
    application_id: str,
    user=Depends(get_current_user)
):
    """Get risk assessment for application"""
    if user["role"] != "underwriter":
        raise HTTPException(status_code=403, detail="Underwriter access required")
    
    try:
        details = ApplicationService.get_application_details(
            application_id, UserRole.UNDERWRITER
        )
        # Calculate risk score using the type-aware model
        app = details["application"]
        app_data = app.data.dict() if hasattr(app.data, 'dict') else app.data
        risk_details = ApplicationService.calculate_risk(app_data)
        risk_score = risk_details['score']

        # Determine risk level based on score
        if risk_score < 30:
            risk_level = "low"
        elif risk_score < 70:
            risk_level = "medium"
        else:
            risk_level = "high"

        # Calculate premium range based on risk score and insurance type
        ins_type = (app_data.get('insuranceType') or '').strip().lower()
        base_map = {
            'auto': 120.0,
            'health': 180.0,
            'life': 200.0,
            'property': 160.0,
        }
        base_premium = base_map.get(ins_type, 150.0)
        risk_multiplier = 1 + (risk_score / 100)
        recommended_premium = base_premium * risk_multiplier

        # Drivers and components are provided by risk_details
        risk_assessment = {
            "application_id": application_id,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "insurance_type": ins_type or 'generic',
            "components": risk_details.get('components', {}),
            "top_drivers": risk_details.get('drivers', []),
            "premium_range": {
                "min": round(recommended_premium * 0.9, 2),
                "max": round(recommended_premium * 1.1, 2),
                "recommended": round(recommended_premium, 2)
            },
            "policy_rules": [
                "Standard coverage available",
                "Risk-based premium calculation applied",
                "Premium adjustment based on calculated risk score"
            ]
        }

        return risk_assessment
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/what-if-simulation/{application_id}")
async def what_if_simulation(
    application_id: str,
    simulation_data: Dict[str, Any],
    user=Depends(get_current_user)
):
    """Run what-if simulation (stub)"""
    if user["role"] != "underwriter":
        raise HTTPException(status_code=403, detail="Underwriter access required")
    
    try:
        # Stub simulation
        base_premium = 200.0
        deductible = simulation_data.get("deductible", 1000)
        term = simulation_data.get("term", 12)
        
        # Simple simulation logic
        premium_adjustment = (1000 / deductible) * 0.1
        term_adjustment = (term / 12) * 0.05
        
        simulated_premium = base_premium * (1 + premium_adjustment + term_adjustment)
        
        simulation_result = {
            "application_id": application_id,
            "input_parameters": simulation_data,
            "simulated_premium": round(simulated_premium, 2),
            "premium_adjustment": round(premium_adjustment * 100, 1),
            "term_adjustment": round(term_adjustment * 100, 1),
            "coverage_details": {
                "deductible": deductible,
                "term_months": term,
                "coverage_amount": 100000
            }
        }
        
        return simulation_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
