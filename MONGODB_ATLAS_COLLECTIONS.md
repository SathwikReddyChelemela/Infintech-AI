# 📊 MongoDB Atlas Collections & Files Used in Your Application

## 🗂️ Database Overview

**Database Name:** `medicalAssistant` (from `.env` file)  
**Connection:** MongoDB Atlas Cloud  
**Storage Types:** Regular Collections + GridFS (for files)

---

## 📦 Collections in MongoDB Atlas

Your application uses **5 main collections** + **2 GridFS collections** (automatically created):

### 1. 👥 **users** Collection
**Purpose:** Store all user accounts and authentication data

**Schema:**
```javascript
{
  _id: ObjectId,
  username: String,          // Unique username
  password: String,          // Hashed password (bcrypt)
  role: String              // "customer", "analyst", "underwriter", "admin"
}
```

**Indexes:**
- `username` (unique) - For fast login lookups
- `role` - For role-based queries

**Used By:**
- Login/authentication
- User management
- Role-based access control

**Sample Document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "customer1",
  "password": "$2b$12$hashed_password_here",
  "role": "customer"
}
```

---

### 2. 📋 **applications** Collection
**Purpose:** Store all insurance application submissions

**Schema:**
```javascript
{
  _id: ObjectId,
  customer_id: String,              // Username of customer
  application_type: String,         // "auto", "health", "life", "property"
  status: String,                   // "draft", "submitted", "under_review", 
                                    // "analyst_approved", "underwriter_review",
                                    // "approved", "rejected"
  
  // Personal Information
  full_name: String,
  date_of_birth: Date,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip_code: String
  },
  
  // Policy Details (vary by type)
  policy_details: {
    // For Auto Insurance
    vehicle_make: String,
    vehicle_model: String,
    vehicle_year: Number,
    vin: String,
    
    // For Health Insurance
    medical_conditions: [String],
    medications: [String],
    
    // For Life Insurance
    beneficiaries: [{
      name: String,
      relationship: String,
      percentage: Number
    }],
    
    // For Property Insurance
    property_type: String,
    property_value: Number,
    construction_year: Number
  },
  
  coverage_amount: Number,
  coverage_term: String,
  
  // Document References
  uploaded_documents: [{
    document_type: String,        // "id_proof", "income_proof", etc.
    file_id: String,              // GridFS file_id
    filename: String,
    file_size: Number,
    uploaded_at: Date
  }],
  
  // Workflow tracking
  analyst_assigned: String,       // Analyst username
  underwriter_assigned: String,   // Underwriter username
  analyst_notes: String,
  underwriter_notes: String,
  rejection_reason: String,
  
  // Verification data (from LLM)
  verification_data: {
    verified_at: Date,
    verified_by: String,          // Analyst username
    extracted_info: Object,       // Data extracted from documents
    match_results: [{
      field: String,
      match: Boolean,
      form_value: String,
      document_value: String,
      confidence: Number
    }],
    overall_match_score: Number
  },
  
  // Timestamps
  created_at: Date,
  updated_at: Date,
  submitted_at: Date,
  approved_at: Date,
  rejected_at: Date
}
```

**Indexes:**
- `customer_id` - Find all applications for a customer
- `status` - Filter by application status
- `created_at` - Sort by date
- `updated_at` - Track recent updates

**Used By:**
- Customer: Submit and view applications
- Analyst: Review and verify applications
- Underwriter: Risk assessment and approval
- Admin: System-wide application management

---

### 3. 📄 **documents** Collection
**Purpose:** Store metadata for uploaded files (actual files in GridFS)

**Schema:**
```javascript
{
  _id: ObjectId,
  application_id: ObjectId,     // Reference to applications collection
  document_type: String,        // "id_proof", "income_proof", "address_proof",
                                // "vehicle_registration", "medical_records", etc.
  filename: String,             // Original filename
  file_id: String,              // GridFS file_id (reference to fs.files)
  file_size: Number,            // Size in bytes
  mime_type: String,            // "application/pdf", "image/jpeg", etc.
  uploaded_by: String,          // Username who uploaded
  uploaded_at: Date,
  
  // LLM extraction results
  extracted_data: {
    document_class: String,     // Classification result
    extracted_fields: Object,   // Key-value pairs extracted
    confidence_score: Number
  },
  
  verified: Boolean,
  verified_by: String,          // Analyst username
  verified_at: Date
}
```

**Indexes:**
- `application_id` - Find all documents for an application
- `document_type` - Filter by document type
- `uploaded_at` - Sort by upload date

**Used By:**
- Customer: Upload documents with application
- Analyst: View and verify documents
- LLM Service: Extract and classify document data

---

### 4. 💬 **messages** Collection
**Purpose:** Store chat messages between roles (if chat feature enabled)

**Schema:**
```javascript
{
  _id: ObjectId,
  application_id: ObjectId,     // Related application (optional)
  from_role: String,            // "customer", "analyst", "underwriter"
  from_username: String,
  to_role: String,
  to_username: String,
  message: String,
  created_at: Date,
  read: Boolean,
  read_at: Date
}
```

**Indexes:**
- `application_id` - Get all messages for an application
- `from_role` / `to_role` - Filter by sender/receiver
- `created_at` - Sort messages chronologically

**Used By:**
- Chat functionality between users
- Application-related communication

---

### 5. 📝 **audit_events** Collection
**Purpose:** Track all important actions for compliance and debugging

**Schema:**
```javascript
{
  _id: ObjectId,
  application_id: ObjectId,     // Related application (optional)
  actor_role: String,           // "customer", "analyst", "underwriter", "admin"
  actor_username: String,       // Who performed the action
  action: String,               // "application_submitted", "document_verified",
                                // "application_approved", "application_rejected",
                                // "status_changed", etc.
  details: Object,              // Action-specific details
  created_at: Date,
  ip_address: String            // (optional) for security
}
```

**Indexes:**
- `application_id` - Get audit trail for an application
- `actor_role` - Filter by role
- `action` - Filter by action type
- `created_at` - Sort by timestamp

**Used By:**
- Admin: Audit trails and compliance
- System: Automatic logging of all actions
- Debugging: Track application lifecycle

**Example Audit Events:**
```json
// Customer submits application
{
  "actor_username": "customer1",
  "actor_role": "customer",
  "action": "application_submitted",
  "details": {
    "application_type": "auto",
    "coverage_amount": 50000
  }
}

// Analyst verifies document
{
  "actor_username": "analyst1",
  "actor_role": "analyst",
  "action": "document_verified",
  "details": {
    "document_type": "id_proof",
    "verification_status": "approved",
    "confidence_score": 0.95
  }
}

// Underwriter approves application
{
  "actor_username": "underwriter1",
  "actor_role": "underwriter",
  "action": "application_approved",
  "details": {
    "premium_amount": 1200,
    "policy_number": "POL-2025-12345"
  }
}
```

---

## 📁 GridFS Collections (Automatic)

**GridFS** is used to store large files (PDFs, images) that exceed MongoDB's 16MB document limit.

### 6. 📦 **fs.files** Collection (Auto-created by GridFS)
**Purpose:** Metadata for files stored in GridFS

**Schema:**
```javascript
{
  _id: ObjectId,               // file_id used in documents collection
  length: Number,              // File size in bytes
  chunkSize: Number,           // 255KB (default)
  uploadDate: Date,
  filename: String,            // Original filename
  metadata: {                  // Custom metadata
    application_id: String,
    document_type: String,
    uploaded_by: String,
    mime_type: String
  }
}
```

### 7. 📦 **fs.chunks** Collection (Auto-created by GridFS)
**Purpose:** Store actual file data in 255KB chunks

**Schema:**
```javascript
{
  _id: ObjectId,
  files_id: ObjectId,          // Reference to fs.files
  n: Number,                   // Chunk number (0, 1, 2, ...)
  data: BinData                // Binary file data
}
```

**Why GridFS?**
- ✅ Handles files > 16MB (though you limit to 300KB)
- ✅ Efficient chunked storage
- ✅ Streaming support for large files
- ✅ Automatic replication with MongoDB Atlas
- ✅ No separate file storage needed

---

## 🔍 How Files Flow Through Your System

### Upload Process:
```
1. Customer submits application with PDF/images
   ↓
2. Backend receives multipart/form-data
   ↓
3. File stored in GridFS:
   - fs.put(file_content) → returns file_id
   - Creates record in fs.files
   - Splits file into chunks in fs.chunks
   ↓
4. Metadata saved in documents collection:
   {
     application_id: "...",
     file_id: "gridfs_file_id",
     filename: "drivers_license.pdf",
     document_type: "id_proof"
   }
   ↓
5. Reference added to applications collection:
   uploaded_documents: [{
     document_type: "id_proof",
     file_id: "gridfs_file_id",
     filename: "drivers_license.pdf"
   }]
```

### Retrieval Process:
```
1. Analyst clicks "Verify Document"
   ↓
2. Frontend requests: GET /analyst/applications/{id}/verify-document
   ↓
3. Backend:
   - Finds document record in documents collection
   - Gets file_id
   - Uses GridFS: fs.get(file_id) to read file
   ↓
4. File sent to LLM for extraction
   ↓
5. Extracted data stored back in documents collection
   ↓
6. Results returned to frontend
```

---

## 📊 Database Statistics

### Current Collections Summary:

| Collection | Purpose | Approx. Size | Indexes |
|------------|---------|--------------|---------|
| **users** | User accounts | ~5-10 docs | 2 |
| **applications** | Insurance applications | Growing | 4 |
| **documents** | Document metadata | Growing | 3 |
| **messages** | Chat messages | Growing | 4 |
| **audit_events** | Audit trail | Growing (large) | 4 |
| **fs.files** | GridFS file metadata | Growing | 1 (auto) |
| **fs.chunks** | GridFS file data | Growing (large) | 1 (auto) |

**Total Indexes:** 19 indexes across all collections

---

## 🔧 Database Configuration

**File:** `server/config/db.py`

```python
# Connection
MONGO_URI = "mongodb+srv://username:password@cluster.mongodb.net/"
DB_NAME = "medicalAssistant"

# SSL Configuration (for macOS)
client = MongoClient(
    MONGO_URI,
    server_api=ServerApi('1'),
    tls=True,
    tlsCAFile=certifi.where()  # Uses system certificates
)

# Collections
db = client[DB_NAME]
users_collection = db["users"]
applications_collection = db["applications"]
documents_collection = db["documents"]
messages_collection = db["messages"]
audit_events_collection = db["audit_events"]

# GridFS (for file storage)
import gridfs
fs = gridfs.GridFS(db)  # Creates fs.files and fs.chunks automatically
```

---

## 📈 Collection Usage by Feature

### Customer Features:
- **users** - Authentication
- **applications** - Submit & view applications
- **documents** - Upload documents
- **fs.files/fs.chunks** - Store PDF/image files
- **audit_events** - Track customer actions

### Analyst Features:
- **applications** - Review applications
- **documents** - Verify documents
- **fs.files/fs.chunks** - Retrieve files for verification
- **audit_events** - Log verification actions

### Underwriter Features:
- **applications** - Risk assessment & approval
- **audit_events** - Log approval/rejection decisions

### Admin Features:
- **users** - User management
- **applications** - System-wide view
- **documents** - Document management
- **messages** - Communication oversight
- **audit_events** - Compliance & audit reports

### LLM Service:
- **documents** - Store extracted data
- **fs.files/fs.chunks** - Read documents for processing
- **applications** - Update verification_data

---

## 🔐 Security & Best Practices

### Implemented:
✅ **Indexed fields** for fast queries  
✅ **GridFS** for secure file storage  
✅ **Audit logging** for all actions  
✅ **Password hashing** (bcrypt)  
✅ **JWT authentication** (not stored in DB)  
✅ **Connection pooling** via MongoClient  
✅ **SSL/TLS encryption** for data in transit  

### MongoDB Atlas Features:
✅ **Automatic backups**  
✅ **Point-in-time recovery**  
✅ **Replication** (3 nodes)  
✅ **Encryption at rest**  
✅ **IP whitelist** (configure in Atlas)  
✅ **Database user authentication**  

---

## 📝 Sample Queries

### Find all submitted applications:
```python
applications_collection.find({"status": "submitted"})
```

### Get customer's applications:
```python
applications_collection.find({"customer_id": "customer1"})
```

### Find unverified documents:
```python
documents_collection.find({"verified": False})
```

### Get audit trail for application:
```python
audit_events_collection.find({
    "application_id": ObjectId("...")
}).sort("created_at", 1)
```

### Store file in GridFS:
```python
import gridfs
fs = gridfs.GridFS(db)

file_id = fs.put(
    file_content,
    filename="document.pdf",
    metadata={
        "application_id": "...",
        "document_type": "id_proof"
    }
)
```

### Retrieve file from GridFS:
```python
grid_file = fs.get(ObjectId(file_id))
file_content = grid_file.read()
```

---

## 🎯 Summary

Your MongoDB Atlas database stores:

1. ✅ **5 main collections** (users, applications, documents, messages, audit_events)
2. ✅ **2 GridFS collections** (fs.files, fs.chunks) - auto-created for file storage
3. ✅ **19 indexes** for optimized queries
4. ✅ **All uploaded documents** (PDFs, images) via GridFS
5. ✅ **Complete audit trail** of all system actions
6. ✅ **Secure password storage** (hashed with bcrypt)
7. ✅ **SSL/TLS encrypted** connections

**Database Size:** Will grow with:
- Number of applications
- Uploaded documents (largest storage)
- Audit events (grows continuously)

**Connection:** Fully cloud-based on MongoDB Atlas with automatic scaling! 🚀
