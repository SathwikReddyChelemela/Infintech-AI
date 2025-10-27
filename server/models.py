from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

# Enums
class ApplicationStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ANALYST_APPROVED = "analyst_approved"
    APPROVED = "approved"
    REJECTED = "rejected"
    DECLINED = "declined"
    PENDING_MORE_INFO = "pending_more_info"

class UserRole(str, Enum):
    CUSTOMER = "customer"
    ANALYST = "analyst"
    UNDERWRITER = "underwriter"
    ADMIN = "admin"
    AUDITOR = "auditor"

class DocumentType(str, Enum):
    ID_PROOF = "id_proof"
    ADDRESS_PROOF = "address_proof"
    MEDICAL_DOC = "medical_doc"
    PAYROLL = "payroll"
    REQUESTED_DOCS = "requested_docs"
    OTHER = "other"

class AuditAction(str, Enum):
    CREATED = "created"
    SUBMITTED = "submitted"
    REQUEST_INFO = "request_info"
    MARK_READY = "mark_ready"
    REVALIDATE = "revalidate"
    APPROVED = "approved"
    DECLINED = "declined"
    PENDED = "pended"
    UPDATED = "updated"
    UPLOADED_DOCUMENT = "uploaded_document"

# Base Models
class User(BaseModel):
    id: str
    username: str
    role: UserRole
    name: str
    email: str
    created_at: datetime
    updated_at: datetime

class ApplicationData(BaseModel):
    # Allow extra/unknown fields to be preserved from various client forms
    model_config = ConfigDict(extra='allow')

    id: Optional[str] = None
    age: Optional[int] = None
    insuranceType: Optional[str] = None
    coverageNeeds: Optional[str] = None
    assetValuation: Optional[float] = None
    income: Optional[float] = None
    debt: Optional[float] = None
    
    # Alternate/newer fields used by the multi-step InsuranceApplicationForm
    fullName: Optional[str] = None
    dateOfBirth: Optional[str] = None
    annualIncome: Optional[float] = None
    maritalStatus: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[str] = None
    coverageAmount: Optional[str] = None
    policyTerm: Optional[str] = None
    deductible: Optional[str] = None

    # Auto-specific
    vehicleMake: Optional[str] = None
    vehicleModel: Optional[str] = None
    vehicleYear: Optional[str] = None
    drivingHistory: Optional[str] = None
    annualMileage: Optional[str] = None

    # Health-specific
    medicalHistory: Optional[str] = None
    preExistingConditions: Optional[str] = None
    familyHistory: Optional[str] = None

    # Life-specific
    smokingStatus: Optional[str] = None
    healthCondition: Optional[str] = None
    coverageTerm: Optional[str] = None

    # Property-specific
    propertyLocation: Optional[str] = None
    propertyType: Optional[str] = None
    constructionMaterial: Optional[str] = None
    propertyValue: Optional[float] = None
    # Keep backward compatibility
    personal: Dict[str, Any] = Field(default_factory=dict)
    health: Dict[str, Any] = Field(default_factory=dict)
    financial: Dict[str, Any] = Field(default_factory=dict)
    consents: Dict[str, Any] = Field(default_factory=dict)
    attachments: List[str] = Field(default_factory=list)

class Application(BaseModel):
    # Preserve unknown/extra fields coming from Mongo so we don't drop server-computed fields
    model_config = ConfigDict(extra='allow')

    id: str
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    customer_id: str
    data: ApplicationData
    input_ready: bool = False
    risk_score: Optional[float] = None
    premium_range: Optional[Dict[str, float]] = None
    # Ensure verification data is included in API responses when present
    verification_data: Optional[Dict[str, Any]] = None

class Document(BaseModel):
    id: str
    application_id: str
    type: DocumentType
    filename: str
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_by: Optional[str] = None
    uploaded_at: datetime

class Message(BaseModel):
    id: str
    application_id: str
    from_role: UserRole
    to_role: UserRole
    body: str
    created_at: datetime

class AuditEvent(BaseModel):
    id: str
    application_id: str
    actor_role: UserRole
    actor_id: str
    action: AuditAction
    payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

# Request/Response Models
class CreateApplicationRequest(BaseModel):
    customer_id: str
    data: ApplicationData

class UpdateApplicationRequest(BaseModel):
    data: ApplicationData

class SubmitApplicationRequest(BaseModel):
    application_id: str

class RequestInfoRequest(BaseModel):
    message: str

class MarkReadyRequest(BaseModel):
    input_ready: bool

class DecisionRequest(BaseModel):
    decision: str  # "approve", "decline", "pend"
    reason: str
    premium_amount: Optional[float] = None

class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: UserRole
    name: str
    email: str

class ApplicationResponse(BaseModel):
    application: Application
    documents: List[Document]
    messages: List[Message]
    audit_events: List[AuditEvent]

class CustomerDashboardResponse(BaseModel):
    draft_application: Optional[Application]
    submitted_applications: List[Application]
    messages: List[Message]

class AnalystDashboardResponse(BaseModel):
    submitted_applications: List[Application]
    pending_review: int
    data_quality_issues: int

class UnderwriterDashboardResponse(BaseModel):
    case_queue: List[Application]
    under_review: int
    sla_breaches: int

class AdminDashboardResponse(BaseModel):
    users: List[User]
    total_applications: int
    system_health: Dict[str, Any]

class AuditorDashboardResponse(BaseModel):
    total_applications: int
    total_audit_events: int
    recent_activities: List[AuditEvent]
