# 📊 MongoDB Atlas - Quick Reference

## Collections Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas Database                       │
│                   "medicalAssistant"                            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    USERS     │     │ APPLICATIONS │     │  DOCUMENTS   │
│  Collection  │     │  Collection  │     │  Collection  │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ • username   │     │ • customer_id│     │ • app_id     │
│ • password   │     │ • type       │     │ • file_id ───┐
│ • role       │     │ • status     │     │ • type       │
│              │     │ • details    │     │ • metadata   │
└──────────────┘     │ • documents  │     └──────────────┘
        │            │ • workflow   │              │
        │            └──────────────┘              │
        │                    │                     │
        └────────────────────┼─────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   MESSAGES   │     │ AUDIT_EVENTS │     │   GridFS     │
│  Collection  │     │  Collection  │     │ (fs.files +  │
├──────────────┤     ├──────────────┤     │  fs.chunks)  │
│ • from/to    │     │ • actor      │     ├──────────────┤
│ • message    │     │ • action     │     │ Stores PDFs, │
│ • timestamp  │     │ • details    │     │ images, etc. │
└──────────────┘     │ • timestamp  │     │ (> 16MB)     │
                     └──────────────┘     └──────────────┘
```

---

## 🎯 Main Collections (5)

| # | Collection | Records | Purpose |
|---|------------|---------|---------|
| 1 | **users** | ~10 | User accounts & auth |
| 2 | **applications** | Growing | Insurance applications |
| 3 | **documents** | Growing | Document metadata |
| 4 | **messages** | Growing | Chat/communication |
| 5 | **audit_events** | Large | Audit trail |

---

## 📁 File Storage (GridFS)

| # | Collection | Auto-Created | Purpose |
|---|------------|--------------|---------|
| 6 | **fs.files** | Yes | File metadata |
| 7 | **fs.chunks** | Yes | File data (255KB chunks) |

---

## 🔗 Collection Relationships

```
users.username ←─────────┐
                         │
                    applications.customer_id
                         │
                         ├─→ documents.application_id
                         │       │
                         │       └─→ documents.file_id → GridFS (fs.files)
                         │                                    │
                         │                                    └─→ fs.chunks
                         │
                         ├─→ messages.application_id
                         │
                         └─→ audit_events.application_id
```

---

## 📈 Data Flow Example

### Customer Submits Application:

```
1. Customer Login
   ↓
   Check: users collection
   
2. Fill Application Form
   ↓
   Save to: applications collection
   
3. Upload Documents (PDF)
   ↓
   Store in: GridFS (fs.files + fs.chunks)
   ↓
   Metadata: documents collection
   
4. Submit Application
   ↓
   Update: applications.status = "submitted"
   ↓
   Log: audit_events collection
```

### Analyst Reviews Application:

```
1. View Applications
   ↓
   Query: applications collection (status = "submitted")
   
2. Open Application
   ↓
   Fetch: application details + related documents
   
3. Verify Document
   ↓
   Retrieve: GridFS (fs.get(file_id))
   ↓
   Send to: LLM for extraction
   ↓
   Save results: documents.extracted_data
   ↓
   Log: audit_events collection
   
4. Approve Application
   ↓
   Update: applications.status = "analyst_approved"
   ↓
   Log: audit_events collection
```

---

## 🔑 Key Fields by Collection

### users
- `username` (unique, indexed)
- `password` (bcrypt hashed)
- `role` (indexed)

### applications
- `customer_id` (indexed)
- `status` (indexed)
- `application_type` (auto, health, life, property)
- `uploaded_documents[]` (references to GridFS)
- `verification_data` (LLM results)
- `created_at` / `updated_at` (indexed)

### documents
- `application_id` (indexed, foreign key)
- `file_id` (GridFS reference)
- `document_type` (indexed)
- `extracted_data` (LLM output)
- `verified` (boolean)

### audit_events
- `application_id` (indexed)
- `actor_username` / `actor_role` (indexed)
- `action` (indexed: submitted, verified, approved, rejected)
- `created_at` (indexed)

### fs.files (GridFS)
- `_id` (file_id)
- `filename`
- `length` (file size)
- `metadata` (custom fields)

---

## 📊 Storage Breakdown

| Data Type | Storage Location | Size |
|-----------|------------------|------|
| User credentials | users | ~1KB/user |
| Application data | applications | ~10KB/app |
| Document metadata | documents | ~2KB/doc |
| Actual files | fs.files + fs.chunks | Variable (up to 300KB/file) |
| Audit logs | audit_events | ~1KB/event |
| Chat messages | messages | ~500B/message |

**Largest Storage:** GridFS (uploaded PDF/images)

---

## 🔍 Common Queries

### Find customer's applications:
```python
applications_collection.find({"customer_id": "customer1"})
```

### Get pending applications for analyst:
```python
applications_collection.find({"status": "submitted"})
```

### Retrieve document file:
```python
# 1. Get metadata
doc = documents_collection.find_one({"_id": ObjectId(...)})

# 2. Get file from GridFS
fs = gridfs.GridFS(db)
file = fs.get(ObjectId(doc['file_id']))
content = file.read()
```

### Get application audit trail:
```python
audit_events_collection.find({
    "application_id": ObjectId(...)
}).sort("created_at", 1)
```

---

## 🎯 Quick Facts

✅ **7 total collections** (5 main + 2 GridFS)  
✅ **19 indexes** for performance  
✅ **GridFS** handles all file uploads  
✅ **Complete audit trail** of all actions  
✅ **SSL/TLS encrypted** connections  
✅ **Automatic backups** via MongoDB Atlas  
✅ **Cloud-based** - no local storage needed  

---

## 📝 Files in MongoDB Atlas

### What's Stored:
- ✅ **Users** - All user accounts
- ✅ **Applications** - All insurance applications
- ✅ **Documents** - Metadata for uploaded files
- ✅ **Actual Files** - PDFs, images via GridFS
- ✅ **Messages** - Chat/communication
- ✅ **Audit Logs** - Complete activity trail

### What's NOT Stored:
- ❌ JWT tokens (stored in browser localStorage)
- ❌ Temporary files (cleaned after upload)
- ❌ Session data (handled by backend)

---

## 🚀 Connection Info

**Location:** `server/config/db.py`

```python
# MongoDB Atlas Connection
MONGO_URI = "mongodb+srv://..."
DB_NAME = "medicalAssistant"

# Collections
users_collection = db["users"]
applications_collection = db["applications"]
documents_collection = db["documents"]
messages_collection = db["messages"]
audit_events_collection = db["audit_events"]

# GridFS (auto-creates fs.files & fs.chunks)
fs = gridfs.GridFS(db)
```

---

**Full Details:** See `MONGODB_ATLAS_COLLECTIONS.md` 📚
