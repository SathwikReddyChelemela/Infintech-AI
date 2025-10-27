from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Dict, Any, List
import json

from auth.routes import get_current_user
from services.application_service import ApplicationService
from models import (
    CreateApplicationRequest, UpdateApplicationRequest, SubmitApplicationRequest,
    ApplicationData, UserRole
)

router = APIRouter()

@router.get("/payment-method")
async def get_payment_method(user=Depends(get_current_user)):
    """Get current customer's saved payment method metadata (masked)."""
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")

    try:
        from config.db import payments_collection
        pm = payments_collection.find_one({"user_id": user["username"]})
        if not pm:
            return {"paymentMethod": None}
        # Only return safe fields
        safe = {
            "last4": pm.get("last4"),
            "expMonth": pm.get("expMonth"),
            "expYear": pm.get("expYear"),
            "name": pm.get("name"),
            "updated_at": pm.get("updated_at")
        }
        return {"paymentMethod": safe}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payment method: {str(e)}")

@router.put("/payment-method")
async def upsert_payment_method(
    payload: Dict[str, Any],
    user=Depends(get_current_user)
):
    """Save masked payment method metadata. Never store full card number or CVV.
    Expected payload: { last4, expMonth, expYear, name }
    """
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")

    try:
        # Validate minimal fields
        required = ["last4", "expMonth", "expYear", "name"]
        for k in required:
            if k not in payload or payload[k] in (None, ""):
                raise HTTPException(status_code=400, detail=f"Missing field: {k}")
        if not str(payload["last4"]).isdigit() or len(str(payload["last4"])) != 4:
            raise HTTPException(status_code=400, detail="last4 must be 4 digits")

        from datetime import datetime
        from config.db import payments_collection

        record = {
            "user_id": user["username"],
            "last4": str(payload.get("last4")),
            "expMonth": int(payload.get("expMonth")),
            "expYear": int(payload.get("expYear")),
            "name": str(payload.get("name")),
            "updated_at": datetime.utcnow(),
        }

        # Unset brand if it existed previously to keep schema clean
        payments_collection.update_one(
            {"user_id": user["username"]},
            {"$set": record, "$unset": {"brand": ""}},
            upsert=True,
        )
        return {"success": True, "paymentMethod": record}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving payment method: {str(e)}")

@router.post("/applications/{application_id}/pay")
async def pay_for_application(
    application_id: str,
    user=Depends(get_current_user)
):
    """Charge the saved payment method for an approved application.
    This is a mock charge: records a payment and marks the application as paid.
    """
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")

    try:
        from datetime import datetime
        from config.db import applications_collection, payments_collection

        # Verify app ownership
        app = applications_collection.find_one({"id": application_id, "customer_id": user["username"]})
        if not app:
            raise HTTPException(status_code=404, detail="Application not found or not owned by you")

        # Must be approved
        if app.get("status") != "approved":
            raise HTTPException(status_code=400, detail="Payment available only for approved applications")

        # Require premium info
        premium_amount = None
        if isinstance(app.get("premium_range"), dict) and "recommended" in app["premium_range"]:
            premium_amount = float(app["premium_range"]["recommended"])
        elif app.get("final_premium"):
            premium_amount = float(app["final_premium"])
        else:
            # Show disabled message when premium cannot be determined
            raise HTTPException(status_code=503, detail="payment is disabled")

        # Check saved payment method
        pm = payments_collection.find_one({"user_id": user["username"]})
        if not pm:
            raise HTTPException(status_code=400, detail="No saved payment method. Please add one first.")

        # Prevent duplicate payment
        if app.get("payment_status") == "paid":
            return {"success": True, "message": "Already paid", "payment": {"receipt_id": app.get("payment_receipt_id")}}

        # Mock charge + store payment record
        receipt_id = ApplicationService.generate_id("PMT")
        payment_record = {
            "id": receipt_id,
            "application_id": application_id,
            "user_id": user["username"],
            "amount": round(premium_amount, 2),
            "currency": "USD",
            "status": "succeeded",
            "method_last4": pm.get("last4"),
            "created_at": datetime.utcnow(),
        }
        payments_collection.insert_one(payment_record)

        # Update application as paid and activate policy
        policy_number = ApplicationService.generate_id("POL")
        applications_collection.update_one(
            {"id": application_id},
            {"$set": {
                "payment_status": "paid",
                "paid_at": datetime.utcnow(),
                "payment_receipt_id": receipt_id,
                "policy_status": "active",
                "policy_number": policy_number,
                "policy_activated_at": datetime.utcnow()
            }}
        )

        return {"success": True, "message": "Payment succeeded", "payment": payment_record, "policy_number": policy_number}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing payment: {str(e)}")

@router.get("/applications/{application_id}/payment")
async def get_payment_receipt(
    application_id: str,
    user=Depends(get_current_user)
):
    """Return the payment record for this application if it belongs to the user."""
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")

    try:
        from config.db import applications_collection, payments_collection
        app = applications_collection.find_one({"id": application_id, "customer_id": user["username"]})
        if not app:
            raise HTTPException(status_code=404, detail="Application not found or not owned by you")
        if app.get("payment_status") != "paid":
            raise HTTPException(status_code=400, detail="No payment found for this application")
        receipt_id = app.get("payment_receipt_id")
        if not receipt_id:
            raise HTTPException(status_code=404, detail="Receipt not found")
        rec = payments_collection.find_one({"id": receipt_id, "application_id": application_id, "user_id": user["username"]})
        if not rec:
            raise HTTPException(status_code=404, detail="Receipt not found")
        # sanitize
        safe = {
            "id": rec.get("id"),
            "amount": rec.get("amount"),
            "currency": rec.get("currency"),
            "status": rec.get("status"),
            "method_last4": rec.get("method_last4"),
            "created_at": rec.get("created_at"),
        }
        return {"receipt": safe}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching receipt: {str(e)}")

@router.get("/dashboard")
async def get_customer_dashboard(user=Depends(get_current_user)):
    """Get customer dashboard data"""
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    
    try:
        dashboard_data = ApplicationService.get_customer_applications(user["username"])
        # Ensure payload is JSON-safe (strip any leftover Mongo _id fields)
        import copy
        safe = copy.deepcopy(dashboard_data)
        def strip_id(obj):
            if isinstance(obj, dict):
                obj.pop('_id', None)
                for v in obj.values():
                    strip_id(v)
            elif isinstance(obj, list):
                for v in obj:
                    strip_id(v)
        strip_id(safe)
        return safe
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/applications/{application_id}/documents")
async def upload_application_document(
    application_id: str,
    document: UploadFile = File(...),
    user=Depends(get_current_user)
):
    """Upload a supporting document to an existing application (customer-owned)"""
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")

    try:
        from config.db import applications_collection

        # Verify application belongs to this customer
        app = applications_collection.find_one({"id": application_id, "customer_id": user["username"]})
        if not app:
            raise HTTPException(status_code=404, detail="Application not found or not owned by you")

        # Read file content
        file_content = await document.read()

        # Store using application service (stores inline content + audit event)
        doc_id = ApplicationService.upload_document(
            application_id,
            document.filename,
            document.content_type or "application/octet-stream",
            file_content,
            UserRole.CUSTOMER,
            user["username"]
        )

        return {"success": True, "message": "Document uploaded", "document_id": doc_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@router.post("/applications")
async def create_application(
    customer_id: str = Form(...),
    data: str = Form(...),
    documents: List[UploadFile] = File([]),
    user=Depends(get_current_user)
):
    """Create new application with file uploads"""
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    
    try:
        # Parse the JSON data
        application_data = json.loads(data)
        
        # Create application
        application = ApplicationService.create_application(
            user["username"], ApplicationData(**application_data)
        )
        
        # Handle file uploads if any
        if documents:
            for doc in documents:
                # Save document to database
                ApplicationService.upload_document(
                    application.id,
                    doc.filename,
                    doc.content_type,
                    doc.file.read(),
                    UserRole.CUSTOMER,
                    user["username"]
                )
        
        # Auto-submit the application if all required fields are present
        try:
            application = ApplicationService.submit_application(
                application.id, UserRole.CUSTOMER, user["username"]
            )
            return {"message": "Application submitted successfully", "application": application}
        except ValueError as e:
            # If submission fails, return the draft application
            return {"message": "Application created as draft", "application": application}
            
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/applications/{application_id}")
async def update_application(
    application_id: str,
    request: UpdateApplicationRequest,
    user=Depends(get_current_user)
):
    """Update application (draft only)"""
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    
    try:
        application = ApplicationService.update_application(
            application_id, request.data, UserRole.CUSTOMER, user["username"]
        )
        return {"message": "Application updated successfully", "application": application}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/applications/{application_id}/submit")
async def submit_application(
    application_id: str,
    user=Depends(get_current_user)
):
    """Submit application"""
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    
    try:
        application = ApplicationService.submit_application(
            application_id, UserRole.CUSTOMER, user["username"]
        )
        # Application submitted successfully
        return {"message": "Application submitted successfully", "application": application}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/applications/{application_id}")
async def get_application_details(
    application_id: str,
    user=Depends(get_current_user)
):
    """Get application details"""
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    
    try:
        details = ApplicationService.get_application_details(
            application_id, UserRole.CUSTOMER
        )
        return details
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/applications/{application_id}/status")
async def get_application_status_by_id(
    application_id: str,
    user=Depends(get_current_user)
):
    """Get application status by ID for customer search"""
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    
    try:
        from config.db import applications_collection, audit_events_collection
        
        # Find the application and verify it belongs to this customer
        application = applications_collection.find_one({
            "id": application_id,
            "customer_id": user["username"]  # Ensure customer can only see their own applications
        })
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found or you do not have access to it")
        
        # Get audit events for this application
        audit_events = list(audit_events_collection.find(
            {"application_id": application_id},
            sort=[("created_at", 1)]  # Sort chronologically
        ))
        
        # Convert datetime objects to ISO strings for JSON serialization
        def serialize_datetime(dt):
            if dt is None:
                return None
            return dt.isoformat() if hasattr(dt, 'isoformat') else str(dt)
        
        # Serialize audit events
        serialized_audit_events = []
        for event in audit_events:
            serialized_event = {
                "application_id": event.get("application_id"),
                "action": event.get("action"),
                "actor_role": event.get("actor_role"),
                "actor_id": event.get("actor_id"),
                "created_at": serialize_datetime(event.get("created_at")),
                "details": event.get("details")
            }
            serialized_audit_events.append(serialized_event)
        
        # Return the application status with audit events
        return {
            "applicationId": application["id"],
            "status": application["status"],
            "lastUpdate": serialize_datetime(application.get("updated_at", application["created_at"])),
            "audit_events": serialized_audit_events,
            "customer_id": application["customer_id"],
            "created_at": serialize_datetime(application["created_at"])
        }
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"Error fetching application status by ID: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching application status")


@router.post("/application")
async def submit_insurance_application(
    applicationId: str = Form(...),
    customerId: str = Form(...),
    status: str = Form(...),
    submittedAt: str = Form(...),
    fullName: str = Form(...),
    dateOfBirth: str = Form(...),
    annualIncome: str = Form(...),
    maritalStatus: str = Form(...),
    occupation: str = Form(...),
    address: str = Form(...),
    insuranceType: str = Form(...),
    coverageAmount: str = Form(...),
    policyTerm: str = Form(...),
    deductible: str = Form(...),
    # Optional auto insurance fields
    vehicleMake: str = Form(None),
    vehicleModel: str = Form(None),
    vehicleYear: str = Form(None),
    drivingHistory: str = Form(None),
    annualMileage: str = Form(None),
    # Optional health insurance fields
    medicalHistory: str = Form(None),
    preExistingConditions: str = Form(None),
    familyHistory: str = Form(None),
    # Optional life insurance fields
    smokingStatus: str = Form(None),
    healthCondition: str = Form(None),
    coverageTerm: str = Form(None),
    # Optional property insurance fields
    propertyLocation: str = Form(None),
    propertyType: str = Form(None),
    constructionMaterial: str = Form(None),
    propertyValue: str = Form(None),
    # Document upload
    document: UploadFile = File(None),
    user=Depends(get_current_user)
):
    """Submit a complete insurance application with document"""
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    
    try:
        from config.db import applications_collection, documents_collection
        from datetime import datetime, date
        import gridfs
        from config.db import db
        
        # Helper to compute age from date string (YYYY-MM-DD)
        def compute_age(dob_str: str) -> int:
            try:
                dob = datetime.fromisoformat(dob_str).date()
            except Exception:
                try:
                    dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
                except Exception:
                    return None
            today = date.today()
            return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        # Create application document
        application_data = {
            "id": applicationId,
            "customer_id": customerId,
            "status": "submitted",
            "created_at": datetime.fromisoformat(submittedAt.replace('Z', '+00:00')),
            "updated_at": datetime.now(),
            "data": {
                "fullName": fullName,
                "dateOfBirth": dateOfBirth,
                "annualIncome": annualIncome,
                "maritalStatus": maritalStatus,
                "occupation": occupation,
                "address": address,
                "insuranceType": insuranceType,
                "coverageAmount": coverageAmount,
                "policyTerm": policyTerm,
                "deductible": deductible
            },
            "state": "analyst_review",
            "assigned_to": None
        }

        # Derive and normalize common fields for compatibility with dashboards
        age_val = compute_age(dateOfBirth) if dateOfBirth else None
        if age_val is not None:
            application_data["data"]["age"] = age_val

        # Map coverageAmount to legacy coverageNeeds if missing
        if coverageAmount and not application_data["data"].get("coverageNeeds"):
            application_data["data"]["coverageNeeds"] = coverageAmount

        # Normalize income number for legacy consumers
        try:
            # Strip non-digits/commas/$ and parse
            income_num = float(str(annualIncome).replace('$', '').replace(',', '').strip()) if annualIncome else None
        except Exception:
            income_num = None
        if income_num is not None:
            application_data["data"]["income"] = income_num

        # Asset valuation fallback: use propertyValue for Property policies
        try:
            prop_val_num = float(str(propertyValue).replace('$', '').replace(',', '').strip()) if propertyValue else None
        except Exception:
            prop_val_num = None
        if insuranceType == "Property" and prop_val_num is not None:
            application_data["data"]["assetValuation"] = prop_val_num
        
        # Add insurance-type specific fields
        if insuranceType == "Auto":
            application_data["data"].update({
                "vehicleMake": vehicleMake,
                "vehicleModel": vehicleModel,
                "vehicleYear": vehicleYear,
                "drivingHistory": drivingHistory,
                "annualMileage": annualMileage
            })
        elif insuranceType == "Health":
            application_data["data"].update({
                "medicalHistory": medicalHistory,
                "preExistingConditions": preExistingConditions,
                "familyHistory": familyHistory
            })
        elif insuranceType == "Life":
            application_data["data"].update({
                "smokingStatus": smokingStatus,
                "healthCondition": healthCondition,
                "coverageTerm": coverageTerm
            })
        elif insuranceType == "Property":
            application_data["data"].update({
                "propertyLocation": propertyLocation,
                "propertyType": propertyType,
                "constructionMaterial": constructionMaterial,
                "propertyValue": propertyValue
            })
        
        # Insert application
        applications_collection.insert_one(application_data)
        
        # Handle document upload if provided
        if document and document.filename:
            # Use GridFS for file storage
            fs = gridfs.GridFS(db)
            
            # Read file content
            file_content = await document.read()
            
            # Store in GridFS
            file_id = fs.put(
                file_content,
                filename=document.filename,
                content_type=document.content_type,
                application_id=applicationId,
                uploaded_by=customerId,
                uploaded_at=datetime.now()
            )
            
            # Generate document ID
            import uuid
            doc_id = f"DOC-{str(uuid.uuid4())[:8].upper()}"
            
            # Create document record
            doc_record = {
                "id": doc_id,
                "application_id": applicationId,
                "type": "supporting_document",
                "file_id": str(file_id),
                "filename": document.filename,
                "content_type": document.content_type,
                "size": len(file_content),
                "uploaded_by": customerId,
                "uploaded_at": datetime.now()
            }
            documents_collection.insert_one(doc_record)
        
        # Create audit event
        from config.db import audit_events_collection
        audit_id = f"AUDIT-{str(uuid.uuid4())[:8].upper()}"
        audit_event = {
            "id": audit_id,
            "application_id": applicationId,
            "action": "application_submitted",
            "actor_role": "customer",
            "actor_id": customerId,
            "details": f"New {insuranceType} insurance application submitted",
            "created_at": datetime.now()
        }
        audit_events_collection.insert_one(audit_event)
        
        return {
            "success": True,
            "message": "Application submitted successfully",
            "applicationId": applicationId,
            "status": "submitted"
        }
        
    except Exception as e:
        print(f"Error submitting application: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error submitting application: {str(e)}")
