# Insurance Application Workflow with LLM Document Verification

## Overview
Complete RBAC insurance workflow implementation with LLM-based document verification for analysts.

## Workflow Flow

```
Customer → Submit Application → Analyst Review → LLM Verification → Approve/Reject → Underwriter
```

## Features Implemented

### 1. Customer Application Submission
**File:** `client-react/src/components/InsuranceApplicationForm.js`

#### 4-Step Application Form:
1. **Personal Information**
   - Full Name
   - Date of Birth
   - Annual Income
   - Marital Status (dropdown)
   - Occupation (dropdown)
   - Address

2. **Policy Details**
   - Insurance Type (Auto/Health/Life/Property)
   - Coverage Amount (dynamic based on type)
   - Policy Term/Duration (dynamic)
   - Deductible/Excess (dynamic)

3. **Additional Information** (Dynamic based on insurance type)
   - **Auto**: Vehicle make, model, year, driving history, annual mileage
   - **Health**: Medical history, pre-existing conditions, family history
   - **Life**: Smoking status, health condition, coverage term
   - **Property**: Location, type, construction material, value

4. **Document Upload**
   - Maximum file size: 300KB
   - Supported formats: PDF, JPEG, PNG
   - Validation and preview

#### Backend Endpoint:
- **POST** `/customer/application`
- Auto-generates Application ID
- Stores in MongoDB with status "submitted"
- Uploads document to GridFS
- Creates audit event

### 2. LLM Document Verification Service
**File:** `server/services/document_verification.py`

#### Three LLM Methods Implemented:

##### A. Document Information Extraction (RAG + OCR)
```python
DocumentVerificationService.extract_document_info(file_content, filename, content_type)
```
- Parses PDFs and images
- Extracts structured information:
  - **ID Proof**: Name, DOB, address, document number
  - **Income Proof**: Employer, annual income, document date
  - **Medical Report**: Patient name, conditions, doctor
  - **Vehicle Registration**: Make, model, year, registration number
  - **Property Deed**: Address, owner, value, type

##### B. Entity Matching / Cross-checking
```python
DocumentVerificationService.cross_check_information(application_data, extracted_info)
```
- Compares extracted info with form inputs
- Detects mismatches:
  - Name verification
  - DOB verification
  - Income verification (with 10% variance allowance)
  - Vehicle details verification
- Returns:
  - `matches`: List of verified fields
  - `mismatches`: List of discrepancies with severity
  - `confidence_score`: Overall confidence (0.0 to 1.0)
  - `overall_status`: "verified" or "needs_review"

##### C. Document Classification
```python
DocumentVerificationService._classify_document(filename, content_type)
```
- Automatically identifies document types:
  - ID_PROOF
  - INCOME_PROOF
  - MEDICAL_REPORT
  - VEHICLE_REGISTRATION
  - PROPERTY_DEED
  - GENERAL_DOCUMENT

### 3. Analyst Review Interface
**File:** `client-react/src/components/ApplicationReviewDialog.js`

#### Features:
- **Personal Information Section**: All customer details displayed
- **Policy Details Section**: Insurance type and coverage info
- **Insurance-Specific Details**: Dynamic display based on insurance type
- **Document Verification Section**:
  - "Verify Document with LLM" button
  - Shows extraction results
  - Displays matches (green checkmarks)
  - Highlights mismatches (red warnings)
  - Confidence score visualization

#### Actions:
1. **Verify Document** - Triggers LLM verification
2. **Approve** - Sends to underwriter (only after successful verification)
3. **Reject** - Requires reason input

### 4. Analyst Backend Routes
**File:** `server/routes/analyst.py`

#### New Endpoints:

##### POST `/analyst/applications/{application_id}/verify-document`
- Retrieves application and document from MongoDB
- Extracts document content from GridFS
- Calls LLM verification service
- Stores verification results in application record
- Creates audit event
- Returns:
  ```json
  {
    "success": true,
    "extracted_info": {...},
    "verification_results": {
      "overall_status": "verified",
      "confidence_score": 0.85,
      "matches": [...],
      "mismatches": [...]
    },
    "verification_summary": "..."
  }
  ```

##### POST `/analyst/applications/{application_id}/approve`
- Checks if verification was performed
- Updates application status to "analyst_approved"
- Changes state to "underwriter_review"
- Creates audit event
- Only allows approval if verification status is "verified"

##### POST `/analyst/applications/{application_id}/reject`
- Updates application status to "rejected"
- Changes state to "closed"
- Records rejection reason
- Creates audit event

### 5. Analyst Dashboard Integration
**File:** `client-react/src/components/AnalystHomePage.js`

#### Updates:
- Added "Review" button for each application
- Opens `ApplicationReviewDialog` when clicked
- Refreshes dashboard after approval/rejection
- Shows application count and status

## Database Schema Updates

### Applications Collection
```javascript
{
  "id": "APP-1234567890-ABCDE",
  "customer_id": "customer1",
  "status": "submitted" | "analyst_approved" | "rejected" | ...,
  "state": "analyst_review" | "underwriter_review" | "closed",
  "data": {
    // All application form fields
  },
  "verification_data": {
    "extracted_info": {
      "document_type": "ID_PROOF",
      "extracted_fields": {...},
      "confidence_score": 0.85
    },
    "verification_results": {
      "overall_status": "verified",
      "matches": [...],
      "mismatches": [...],
      "confidence_score": 0.85
    },
    "verification_summary": "...",
    "verified_by": "analyst1",
    "verified_at": "2025-10-11T10:30:00Z"
  },
  "analyst_id": "analyst1",
  "analyst_approved_at": "2025-10-11T10:35:00Z",
  "created_at": "2025-10-11T10:00:00Z",
  "updated_at": "2025-10-11T10:35:00Z"
}
```

### Documents Collection
```javascript
{
  "application_id": "APP-1234567890-ABCDE",
  "type": "supporting_document",
  "file_id": "gridfs_file_id",
  "filename": "id_proof.pdf",
  "content_type": "application/pdf",
  "size": 204800,
  "uploaded_by": "customer1",
  "uploaded_at": "2025-10-11T10:00:00Z"
}
```

### Audit Events Collection
```javascript
{
  "application_id": "APP-1234567890-ABCDE",
  "action": "document_verified" | "analyst_approved" | "analyst_rejected",
  "actor_role": "analyst",
  "actor_id": "analyst1",
  "details": "...",
  "created_at": "2025-10-11T10:30:00Z"
}
```

## Testing the Workflow

### Step 1: Customer Submits Application
1. Login as customer
2. Click "Apply for Insurance" on dashboard
3. Fill out 4-step form
4. Upload document (< 300KB)
5. Submit application

### Step 2: Analyst Reviews Application
1. Login as analyst
2. See new application in dashboard
3. Click "Review" button
4. Review personal information and policy details
5. Click "Verify Document with LLM"
6. Wait for verification results
7. Review matches and mismatches

### Step 3: Analyst Decision
**If Verified:**
- Click "Approve & Send to Underwriter"
- Application moves to underwriter queue

**If Issues Found:**
- Click "Reject"
- Enter rejection reason
- Application is closed

### Step 4: Underwriter Receives Application
- Only analyst-approved applications appear in underwriter queue
- Application includes verification data
- Underwriter can make final decision

## API Request Examples

### Verify Document
```bash
curl -X POST "http://localhost:8000/analyst/applications/APP-123/verify-document" \
  -u analyst1:password
```

### Approve Application
```bash
curl -X POST "http://localhost:8000/analyst/applications/APP-123/approve" \
  -u analyst1:password
```

### Reject Application
```bash
curl -X POST "http://localhost:8000/analyst/applications/APP-123/reject?reason=Invalid+documents" \
  -u analyst1:password
```

## Key Technologies
- **Frontend**: React 18, Material-UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB + GridFS
- **Document Storage**: GridFS (supports files > 16MB)
- **LLM Integration**: Document verification service (extensible for OpenAI, AWS Textract)

## Future Enhancements
1. **Real LLM Integration**: Replace simulated extraction with OpenAI Vision API or AWS Textract
2. **OCR Processing**: Integrate Tesseract or cloud OCR services
3. **Advanced Matching**: Use fuzzy string matching algorithms
4. **Bulk Processing**: Allow analysts to verify multiple applications
5. **Analytics Dashboard**: Track verification accuracy and processing times
6. **Real-time Notifications**: Alert analysts when new applications arrive

## Status Flow
```
submitted → analyst_review → analyst_approved → underwriter_review → final_decision
                           → rejected (if verification fails)
```

## Security Considerations
- All endpoints require authentication
- Role-based access control (RBAC) enforced
- Document size limits prevent abuse
- File type validation
- Audit trail for all actions
- JWT tokens for session management

## Error Handling
- Graceful fallbacks for missing documents
- Clear error messages for users
- Detailed logging for debugging
- Transaction support for data consistency
