import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from config.db import (
    applications_collection, documents_collection, 
    messages_collection, audit_events_collection
)
from models import (
    Application, ApplicationData, ApplicationStatus, UserRole, AuditAction,
    Document, Message, AuditEvent, DocumentType
)

class ApplicationService:
    
    @staticmethod
    def generate_id(prefix: str = "APP") -> str:
        """Generate unique ID with prefix"""
        return f"{prefix}-{str(uuid.uuid4())[:8].upper()}"
    
    @staticmethod
    def create_audit_event(
        application_id: str,
        actor_role: UserRole,
        actor_id: str,
        action: AuditAction,
        payload: Dict[str, Any] = None
    ) -> str:
        """Create audit event"""
        audit_id = ApplicationService.generate_id("AUDIT")
        audit_event = {
            "id": audit_id,
            "application_id": application_id,
            "actor_role": actor_role,
            "actor_id": actor_id,
            "action": action,
            "payload": payload or {},
            "created_at": datetime.now()
        }
        audit_events_collection.insert_one(audit_event)
        return audit_id
    
    @staticmethod
    def create_application(customer_id: str, data: ApplicationData) -> Application:
        """Create new application (Customer only)"""
        app_id = ApplicationService.generate_id()
        now = datetime.now()
        
        application = {
            "id": app_id,
            "status": ApplicationStatus.DRAFT,
            "created_at": now,
            "updated_at": now,
            "customer_id": customer_id,
            "data": data.dict(),
            "input_ready": False,
            "risk_score": None,
            "premium_range": None
        }
        
        applications_collection.insert_one(application)
        
        # Create audit event
        ApplicationService.create_audit_event(
            app_id, UserRole.CUSTOMER, customer_id, AuditAction.CREATED
        )
        
        return Application(**application)
    
    @staticmethod
    def update_application(
        application_id: str, 
        data: ApplicationData, 
        actor_role: UserRole,
        actor_id: str
    ) -> Application:
        """Update application (Customer only for drafts)"""
        app = applications_collection.find_one({"id": application_id})
        if not app:
            raise ValueError("Application not found")
        
        # Only customers can update their own draft applications
        if actor_role != UserRole.CUSTOMER or app["status"] != ApplicationStatus.DRAFT:
            raise ValueError("Cannot update application")
        
        update_data = {
            "data": data.dict(),
            "updated_at": datetime.now()
        }
        
        applications_collection.update_one(
            {"id": application_id}, {"$set": update_data}
        )
        
        # Create audit event
        ApplicationService.create_audit_event(
            application_id, actor_role, actor_id, AuditAction.UPDATED
        )
        
        updated_app = applications_collection.find_one({"id": application_id})
        # Remove Mongo-specific field to ensure JSON-serializable response
        if updated_app and "_id" in updated_app:
            updated_app.pop("_id", None)
        return Application(**updated_app)
    
    @staticmethod
    def submit_application(
        application_id: str, 
        actor_role: UserRole,
        actor_id: str
    ) -> Application:
        """Submit application (Customer only)"""
        app = applications_collection.find_one({"id": application_id})
        if not app:
            raise ValueError("Application not found")
        
        if actor_role != UserRole.CUSTOMER or app["status"] != ApplicationStatus.DRAFT:
            raise ValueError("Cannot submit application")
        
        # Validate required fields
        data = app["data"]
        required_fields = ["age", "insuranceType", "coverageNeeds", "assetValuation", "income", "debt"]
        for field in required_fields:
            if not data.get(field):
                raise ValueError(f"Missing required field: {field}")
        
        update_data = {
            "status": ApplicationStatus.SUBMITTED,
            "updated_at": datetime.now()
        }
        
        applications_collection.update_one(
            {"id": application_id}, {"$set": update_data}
        )
        
        # Create audit event
        ApplicationService.create_audit_event(
            application_id, actor_role, actor_id, AuditAction.SUBMITTED
        )
        
        updated_app = applications_collection.find_one({"id": application_id})
        return Application(**updated_app)
    
    @staticmethod
    def request_info(
        application_id: str,
        message: str,
        actor_role: UserRole,
        actor_id: str
    ) -> Message:
        """Request more info from customer (Analyst only)"""
        app = applications_collection.find_one({"id": application_id})
        if not app:
            raise ValueError("Application not found")
        
        if actor_role != UserRole.ANALYST:
            raise ValueError("Only analysts can request info")
        
        # Update application status
        applications_collection.update_one(
            {"id": application_id}, 
            {"$set": {"status": ApplicationStatus.PENDING_MORE_INFO, "updated_at": datetime.now()}}
        )
        
        # Create message
        message_id = ApplicationService.generate_id("MSG")
        message_data = {
            "id": message_id,
            "application_id": application_id,
            "from_role": UserRole.ANALYST,
            "to_role": UserRole.CUSTOMER,
            "body": message,
            "created_at": datetime.now()
        }
        
        messages_collection.insert_one(message_data)
        
        # Create audit event
        ApplicationService.create_audit_event(
            application_id, actor_role, actor_id, AuditAction.REQUEST_INFO, {"message": message}
        )
        
        return Message(**message_data)
    
    @staticmethod
    def _to_number(value: Any, default: float = 0.0) -> float:
        """Parse numeric strings like '100k', '1,200', or raw numbers to float."""
        try:
            if value is None:
                return default
            if isinstance(value, (int, float)):
                return float(value)
            s = str(value).strip().replace(',', '')
            mult = 1.0
            if s.lower().endswith('k'):
                mult = 1000.0
                s = s[:-1]
            return float(s) * mult
        except Exception:
            return default

    @staticmethod
    def _clamp(x: float, lo: float = 0.0, hi: float = 100.0) -> float:
        return max(lo, min(hi, x))

    @staticmethod
    def _score_ratio(ratio: float, caps: Dict[str, float]) -> float:
        """Map a ratio to 0-100 with simple capping. caps expects keys: low, high."""
        low = caps.get('low', 0.0)
        high = caps.get('high', 5.0)
        if ratio <= low:
            return 0.0
        if ratio >= high:
            return 100.0
        return (ratio - low) / (high - low) * 100.0

    @staticmethod
    def calculate_risk(application_data: dict) -> Dict[str, Any]:
        """Type-aware risk scoring. Returns {'score': float, 'components': {}, 'drivers': [], 'type': str}.

        Components are 0-100 risk contributions. Final score is a weighted sum by insurance line.
        """
        data = application_data or {}
        ins_type = (data.get('insuranceType') or '').strip().lower()

        # Common numeric fields (fallback to legacy keys)
    # age can be used in some line-specific scoring; parsed lazily in those branches
        income = ApplicationService._to_number(data.get('income') or data.get('annualIncome'), 1.0) or 1.0
        asset_val = ApplicationService._to_number(data.get('assetValuation') or data.get('propertyValue'), 1.0) or 1.0
        debt = ApplicationService._to_number(data.get('debt'), 0.0)
        coverage = ApplicationService._to_number(data.get('coverageNeeds') or data.get('coverageAmount'), 0.0)

        # Baseline components
        dti = debt / income if income > 0 else float('inf')  # if no income, treat as max risk
        cov_income = coverage / income if income > 0 else float('inf')
        cov_asset = coverage / asset_val if asset_val > 0 else 0.0

        # Map to 0-100 (stricter caps)
        # Stricter: DTI low threshold 5%, high 60% => 100 risk quickly for high leverage
        dti_score = ApplicationService._score_ratio(dti, {'low': 0.05, 'high': 0.6})
        # Stricter: Coverage/Income low 10%, high 300%
        cov_income_score = ApplicationService._score_ratio(cov_income, {'low': 0.1, 'high': 3.0})
        # Slightly stricter: Coverage/Asset low 5%, high 150%
        cov_asset_score = ApplicationService._score_ratio(cov_asset, {'low': 0.05, 'high': 1.5})

        # Income level component: penalize low absolute income regardless of ratios
        # Piecewise mapping (USD)
        if income <= 0:
            income_level_score = 100.0
        elif income <= 10000:
            income_level_score = 95.0
        elif income <= 20000:
            income_level_score = 85.0
        elif income <= 40000:
            income_level_score = 70.0
        elif income <= 80000:
            income_level_score = 50.0
        elif income <= 120000:
            income_level_score = 35.0
        else:
            income_level_score = 20.0

        components: Dict[str, float] = {
            'dti': round(dti_score, 2),
            'coverage_to_income': round(cov_income_score, 2),
            'coverage_to_asset': round(cov_asset_score, 2),
            'income_level': round(income_level_score, 2),
        }

        drivers: List[str] = []

        # Type-specific components and weights
        if ins_type == 'auto':
            # Driving history
            hist = (data.get('drivingHistory') or '').lower()
            hist_map = {
                'clean': 10,
                'minor violations': 40,
                'major violations': 75,
                'accidents': 85,
            }
            hist_score = hist_map.get(hist, 30)
            # Annual mileage (0-50k mapped to 0-100)
            miles = ApplicationService._to_number(data.get('annualMileage'), 12000)
            miles_score = ApplicationService._clamp((miles / 50000) * 100)
            # Vehicle age (older => higher risk up to 20 yrs)
            vy = ApplicationService._to_number(data.get('vehicleYear'), datetime.now().year)
            vehicle_age = max(0, datetime.now().year - int(vy or 0))
            vehicle_age_score = ApplicationService._clamp((vehicle_age / 20) * 100)
            # Driver age: very young/very old => higher risk; U-shaped
            driver_age = ApplicationService._to_number(data.get('age'), 30)
            if driver_age <= 20:
                age_score = 80
            elif driver_age <= 25:
                age_score = 60
            elif driver_age <= 65:
                age_score = 20
            else:
                age_score = 50

            components.update({
                'driving_history': hist_score,
                'annual_mileage': round(miles_score, 2),
                'vehicle_age': round(vehicle_age_score, 2),
                'driver_age': age_score,
            })

            weights = {
                'driving_history': 0.25,
                'annual_mileage': 0.10,
                'vehicle_age': 0.08,
                'driver_age': 0.10,
                'coverage_to_income': 0.18,
                'coverage_to_asset': 0.05,
                'dti': 0.15,
                'income_level': 0.09,
            }
        elif ins_type == 'health':
            pre = (data.get('preExistingConditions') or '').strip()
            pre_count = len([p for p in pre.replace(',', ' ').split() if p])
            pre_score = ApplicationService._clamp(pre_count * 15, 0, 100)
            fam_hist = (data.get('familyHistory') or '').strip()
            fam_score = 30 if fam_hist else 0
            med_hist = (data.get('medicalHistory') or '').strip()
            med_score = 20 if len(med_hist) > 50 else (10 if med_hist else 0)
            # Age (older => higher risk)
            h_age = ApplicationService._to_number(data.get('age'), 35)
            age_score = ApplicationService._clamp((h_age / 100) * 100)

            components.update({
                'pre_existing': pre_score,
                'family_history': fam_score,
                'medical_history': med_score,
                'age': round(age_score, 2),
            })
            weights = {
                'pre_existing': 0.25,
                'family_history': 0.07,
                'medical_history': 0.08,
                'age': 0.16,
                'coverage_to_income': 0.20,
                'dti': 0.10,
                'coverage_to_asset': 0.05,
                'income_level': 0.09,
            }
        elif ins_type == 'life':
            smoking = (data.get('smokingStatus') or '').lower()
            smoke_map = {
                'non-smoker': 10,
                'occasional smoker': 40,
                'regular smoker': 80,
            }
            smoke_score = smoke_map.get(smoking, 30 if smoking else 10)
            health_cond = (data.get('healthCondition') or '').lower()
            health_map = {
                'excellent': 10,
                'good': 25,
                'fair': 50,
                'poor': 80,
            }
            health_score = health_map.get(health_cond, 40 if health_cond else 30)
            l_age = ApplicationService._to_number(data.get('age'), 35)
            age_score = ApplicationService._clamp((l_age / 100) * 100)

            components.update({
                'smoking': smoke_score,
                'health_condition': health_score,
                'age': round(age_score, 2),
            })
            weights = {
                'age': 0.25,
                'smoking': 0.25,
                'health_condition': 0.20,
                'coverage_to_income': 0.15,
                'dti': 0.10,
                'income_level': 0.05,
            }
        elif ins_type == 'property':
            ptype = (data.get('propertyType') or '').lower()
            ptype_map = {
                'apartment': 20,
                'condo': 25,
                'house': 35,
                'villa': 45,
            }
            ptype_score = ptype_map.get(ptype, 30 if ptype else 35)
            material = (data.get('constructionMaterial') or '').lower()
            mat_map = {
                'concrete': 10,
                'brick': 20,
                'steel': 15,
                'wood': 50,
            }
            mat_score = mat_map.get(material, 30 if material else 35)
            cov_asset_score_prop = ApplicationService._score_ratio(
                (ApplicationService._to_number(data.get('coverageAmount'), 0.0) / (asset_val or 1.0)),
                {'low': 0.2, 'high': 1.5}
            )

            components.update({
                'property_type': ptype_score,
                'construction_material': mat_score,
                'coverage_to_asset': round(cov_asset_score_prop, 2),
            })
            weights = {
                'property_type': 0.15,
                'construction_material': 0.10,
                'coverage_to_asset': 0.25,
                'coverage_to_income': 0.15,
                'dti': 0.15,
                'age': 0.05,
                'income_level': 0.15,
            }
            # Add minimal age component if present
            if ApplicationService._to_number(data.get('age'), 0) > 0:
                components['age'] = ApplicationService._clamp((ApplicationService._to_number(data.get('age')) / 100) * 100)
        else:
            # Generic fallback
            age_score = ApplicationService._clamp((ApplicationService._to_number(data.get('age'), 35) / 100) * 100)
            components.update({'age': round(age_score, 2)})
            weights = {
                'age': 0.20,
                'coverage_to_income': 0.35,
                'coverage_to_asset': 0.15,
                'dti': 0.15,
                'income_level': 0.15,
            }

        # Ensure baseline components are present for weighting
        for k in ['coverage_to_income', 'coverage_to_asset', 'dti']:
            if k not in components and k in ['coverage_to_income', 'coverage_to_asset', 'dti']:
                components[k] = round({'coverage_to_income': cov_income_score, 'coverage_to_asset': cov_asset_score, 'dti': dti_score}[k], 2)

        # Weighted sum
        score = 0.0
        for comp, w in weights.items():
            val = components.get(comp, 0.0)
            score += w * val
        score = ApplicationService._clamp(score, 0, 100)

        # Enforce strict floors for very low income
        if income <= 0:
            score = max(score, 80.0)
        elif income < 10000:
            score = max(score, 55.0)
        elif income < 20000:
            score = max(score, 40.0)

        # Compute drivers (top components by weight*value)
        contribs = sorted(((c, components.get(c, 0.0) * weights.get(c, 0.0)) for c in components.keys()), key=lambda x: x[1], reverse=True)
        for name, val in contribs[:4]:
            drivers.append(f"{name.replace('_', ' ').title()}: +{round(val, 1)}")

        return {
            'type': ins_type or 'generic',
            'score': round(score, 2),
            'components': components,
            'drivers': drivers,
        }

    @staticmethod
    def calculate_risk_score(application_data: dict) -> float:
        """Backward-compatible wrapper returning only the score."""
        try:
            details = ApplicationService.calculate_risk(application_data)
            return float(details.get('score', 0.0))
        except Exception:
            return 0.0

    @staticmethod
    def mark_ready_for_scoring(
        application_id: str,
        input_ready: bool,
        actor_role: UserRole,
        actor_id: str
    ) -> Application:
        """Mark application ready for scoring (Analyst only)"""
        app = applications_collection.find_one({"id": application_id})
        if not app:
            raise ValueError("Application not found")
        
        if actor_role != UserRole.ANALYST:
            raise ValueError("Only analysts can mark ready for scoring")
        
        update_data = {
            "input_ready": input_ready,
            "updated_at": datetime.now()
        }
        
        applications_collection.update_one(
            {"id": application_id}, {"$set": update_data}
        )
        
        # Create audit event
        ApplicationService.create_audit_event(
            application_id, actor_role, actor_id, AuditAction.MARK_READY, {"input_ready": input_ready}
        )
        
        updated_app = applications_collection.find_one({"id": application_id})
        return Application(**updated_app)
    
    @staticmethod
    def make_decision(
        application_id: str,
        decision: str,
        reason: str,
        premium_amount: Optional[float] = None,
        actor_role: UserRole = UserRole.UNDERWRITER,
        actor_id: str = None
    ) -> Application:
        """Make decision on application (Underwriter only)"""
        app = applications_collection.find_one({"id": application_id})
        if not app:
            raise ValueError("Application not found")
        
        if actor_role != UserRole.UNDERWRITER:
            raise ValueError("Only underwriters can make decisions")
        
        # Map decision to status
        status_mapping = {
            "approve": ApplicationStatus.APPROVED,
            "decline": ApplicationStatus.DECLINED,
            "pend": ApplicationStatus.UNDER_REVIEW
        }
        
        if decision not in status_mapping:
            raise ValueError("Invalid decision")
        
        new_status = status_mapping[decision]
        # Finalize application: set final status and close underwriter review state
        update_data = {
            "status": new_status,
            "state": "closed",
            "underwriter_id": actor_id,
            "decision_reason": reason,
            "decided_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        if premium_amount:
            update_data["premium_range"] = {"min": premium_amount * 0.9, "max": premium_amount * 1.1}
            update_data["final_premium"] = round(float(premium_amount), 2)
        
        applications_collection.update_one(
            {"id": application_id}, {"$set": update_data}
        )
        
        # Create audit event
        audit_action = AuditAction.APPROVED if decision == "approve" else (
            AuditAction.DECLINED if decision == "decline" else AuditAction.PENDED
        )
        
        ApplicationService.create_audit_event(
            application_id, actor_role, actor_id, audit_action, 
            {"reason": reason, "premium_amount": premium_amount}
        )
        
        updated_app = applications_collection.find_one({"id": application_id})
        if updated_app and "_id" in updated_app:
            updated_app.pop("_id", None)
        return Application(**updated_app)
    
    @staticmethod
    def get_customer_applications(customer_id: str) -> Dict[str, Any]:
        """Get applications for customer"""
        draft = applications_collection.find_one({
            "customer_id": customer_id, 
            "status": ApplicationStatus.DRAFT
        })
        
        submitted = list(applications_collection.find({
            "customer_id": customer_id,
            "status": {"$ne": ApplicationStatus.DRAFT}
        }))

        # Sanitize Mongo-specific fields
        def _sanitize_app(a: Dict[str, Any]) -> Dict[str, Any]:
            if not a:
                return a
            a = dict(a)
            a.pop('_id', None)
            return a
        draft = _sanitize_app(draft) if draft else None
        submitted = [_sanitize_app(a) for a in submitted]
        
        raw_messages = list(messages_collection.find({
            "application_id": {"$in": [app["id"] for app in submitted]},
            "to_role": UserRole.CUSTOMER
        }))
        # Remove Mongo-specific _id for safe serialization into Pydantic models
        messages = []
        for m in raw_messages:
            if m and "_id" in m:
                m = {k: v for k, v in m.items() if k != "_id"}
            messages.append(m)
        
        return {
            "draft_application": Application(**draft) if draft else None,
            "submitted_applications": [Application(**app) for app in submitted],
            "messages": [Message(**msg) for msg in messages]
        }
    
    @staticmethod
    def get_analyst_applications() -> Dict[str, Any]:
        """Get applications for analyst"""
        # Only show submitted applications that haven't been approved yet
        submitted = list(applications_collection.find({
            "status": ApplicationStatus.SUBMITTED,
            "input_ready": {"$ne": True}  # Exclude applications already approved by analyst
        }))

        # Remove Mongo _id for safe serialization
        submitted = [
            {k: v for k, v in app.items() if k != '_id'}
            for app in submitted
        ]
        
        pending_review = len(submitted)
        data_quality_issues = len([app for app in submitted if not app.get("input_ready", False)])
        
        return {
            "submitted_applications": [Application(**app) for app in submitted],
            "pending_review": pending_review,
            "data_quality_issues": data_quality_issues
        }
    
    @staticmethod
    def get_underwriter_applications() -> Dict[str, Any]:
        """Get applications for underwriter"""
        # Case queue should include:
        # - Applications explicitly approved by analyst (status=analyst_approved)
        # - Applications in state 'underwriter_review'
        # - Submitted applications marked input_ready by analyst (legacy path)
        case_queue = list(applications_collection.find({
            "$or": [
                {"status": ApplicationStatus.ANALYST_APPROVED},
                {"state": "underwriter_review"},
                {"status": ApplicationStatus.SUBMITTED, "input_ready": True}
            ]
        }))

        # Under review should include status or state indicating active underwriter review
        under_review_apps = list(applications_collection.find({
            "$or": [
                {"status": ApplicationStatus.UNDER_REVIEW},
                {"state": "under_review"}
            ]
        }))
        
        # Combine both lists and de-duplicate by application id
        combined = case_queue + under_review_apps
        seen = set()
        all_apps = []
        for app in combined:
            app_id = app.get("id")
            if app_id in seen:
                continue
            seen.add(app_id)
            all_apps.append(app)

        # Sanitize
        all_apps = [{k: v for k, v in app.items() if k != '_id'} for app in all_apps]
        
        under_review = len(under_review_apps)
        sla_breaches = 0  # Placeholder for SLA calculation
        
        return {
            "case_queue": [Application(**app) for app in all_apps],
            "under_review": under_review,
            "sla_breaches": sla_breaches
        }
    
    @staticmethod
    def get_application_details(application_id: str, user_role: UserRole) -> Dict[str, Any]:
        """Get detailed application information with role-based access"""
        app = applications_collection.find_one({"id": application_id})
        if not app:
            raise ValueError("Application not found")
        # Remove Mongo _id which is not JSON serializable
        app.pop('_id', None)

        # Role-based access control
        if user_role == UserRole.CUSTOMER:
            # Customers can only see their own applications
            pass  # Add customer validation if needed

        documents = list(documents_collection.find({"application_id": application_id}))
        messages = list(messages_collection.find({"application_id": application_id}))
        audit_events = list(audit_events_collection.find({"application_id": application_id}))

        # Convert documents to handle database format
        converted_documents = []
        for doc in documents:
            # Convert _id to id if needed
            if '_id' in doc and 'id' not in doc:
                doc['id'] = str(doc['_id'])
            # Handle document type conversion
            if 'type' in doc and doc['type'] not in ['id_proof', 'address_proof', 'medical_doc', 'payroll', 'requested_docs', 'other']:
                doc['type'] = 'other'  # Default to 'other' for unknown types
            try:
                converted_documents.append(Document(**doc))
            except Exception as e:
                print(f"Warning: Could not convert document {doc.get('_id', 'unknown')}: {e}")
                continue
        
        # Convert messages to handle database format
        converted_messages = []
        for msg in messages:
            if '_id' in msg and 'id' not in msg:
                msg['id'] = str(msg['_id'])
            try:
                converted_messages.append(Message(**msg))
            except Exception as e:
                print(f"Warning: Could not convert message {msg.get('_id', 'unknown')}: {e}")
                continue
        
        # Convert audit events to handle database format
        converted_audit_events = []
        for event in audit_events:
            if '_id' in event and 'id' not in event:
                event['id'] = str(event['_id'])
            try:
                converted_audit_events.append(AuditEvent(**event))
            except Exception as e:
                print(f"Warning: Could not convert audit event {event.get('_id', 'unknown')}: {e}")
                continue
        
        return {
            "application": Application(**app),
            "documents": converted_documents,
            "messages": converted_messages,
            "audit_events": converted_audit_events
        }

    @staticmethod
    def upload_document(
        application_id: str,
        filename: str,
        content_type: str,
        file_content: bytes,
        actor_role: UserRole,
        actor_id: str
    ) -> str:
        """Upload document for application"""
        # Verify application exists
        app = applications_collection.find_one({"id": application_id})
        if not app:
            raise ValueError("Application not found")
        
        # Generate document ID
        doc_id = ApplicationService.generate_id("DOC")
        
        # Create document record
        document = {
            "id": doc_id,
            "application_id": application_id,
            "filename": filename,
            "content_type": content_type,
            "file_size": len(file_content),
            "uploaded_by": actor_id,
            "uploaded_at": datetime.now(),
            "type": DocumentType.REQUESTED_DOCS
        }
        
        # Store document metadata in database
        documents_collection.insert_one(document)
        
        # Store file content (in a real app, you'd store this in a file system or cloud storage)
        # For now, we'll store it in the database as well
        document["content"] = file_content
        documents_collection.update_one(
            {"id": doc_id}, 
            {"$set": {"content": file_content}}
        )
        
        # Create audit event
        ApplicationService.create_audit_event(
            application_id, actor_role, actor_id, AuditAction.UPLOADED_DOCUMENT, 
            {"filename": filename, "document_id": doc_id}
        )
        
        return doc_id
