# Admin Document Upload Setup Guide

This guide will help you set up the admin functionality for uploading documents to Pinecone vector database.

## 🚀 Quick Start

### 1. Environment Configuration

Copy the example environment file and configure it:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your actual values:

```bash
# Required for admin document upload
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_ENV=us-east-1
PINECONE_INDEX_NAME=medical-assistant-kb
GROQ_API_KEY=gsk_your-groq-api-key-here
MONGODB_CONNECTION_STRING=mongodb+srv://...

# Admin credentials
DEFAULT_ADMIN_EMAIL=admin@medical.com
DEFAULT_ADMIN_PASSWORD=admin123
```

### 2. Create Pinecone Index

1. Sign up at [Pinecone](https://www.pinecone.io/)
2. Create a new index with these settings:
   - **Name**: `medical-assistant-kb`
   - **Dimensions**: `1536` (for OpenAI embeddings)
   - **Metric**: `cosine`
   - **Cloud**: `AWS`
   - **Region**: `us-east-1`

### 3. Install Dependencies

```bash
cd server
pip install -r requirements.txt
```

### 4. Create Admin User

```bash
python create_test_users.py
```

### 5. Start the Server

```bash
python main.py
```

### 6. Start the Frontend

```bash
cd ../client-react
npm install
npm start
```

## 🔧 Admin Features

### Document Upload to Pinecone

The admin dashboard provides:

1. **Dashboard Statistics**
   - Total applications, users, audit events
   - Application status breakdown
   - User role distribution

2. **Knowledge Base Management**
   - Upload documents to Pinecone
   - Role-based access control
   - Document metadata tracking
   - List all uploaded documents

3. **Supported File Types**
   - PDF files (.pdf)
   - Text files (.txt)
   - Word documents (.doc, .docx)

### Role-Based Document Access

Documents can be uploaded with specific role access:
- **General**: All users can access
- **Customer**: Only customers
- **Analyst**: Only analysts  
- **Underwriter**: Only underwriters
- **Admin**: Only administrators
- **Auditor**: Only auditors

## 📝 Usage Guide

### Uploading Documents

1. Login as admin (`admin@medical.com`)
2. Navigate to Admin Dashboard
3. Go to "Knowledge Base" tab
4. Click "Upload Knowledge Documents to Pinecone"
5. Select files and set role access
6. Add description (optional)
7. Click "Upload to Pinecone"

### Document Processing

The system automatically:
1. Extracts text from uploaded files
2. Splits text into chunks
3. Generates embeddings
4. Stores in Pinecone with metadata
5. Tracks upload in MongoDB

### Chat Integration

Uploaded documents are automatically available in the chat system:
- Users with appropriate roles can query the knowledge base
- The AI assistant searches Pinecone for relevant context
- Responses include document-based information

## 🧪 Testing

### Manual Testing

1. **Test Admin Login**:
   ```bash
   curl -X POST http://localhost:8000/auth/login \
     -d "username=admin@medical.com&password=admin123"
   ```

2. **Test Dashboard Stats** (replace TOKEN):
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:8000/admin/dashboard
   ```

3. **Test Document Upload**:
   Use the admin dashboard UI to upload test documents.

### Automated Testing

Run the test script:
```bash
cd server
python test_admin.py
```

## 🔍 Troubleshooting

### Common Issues

1. **Pinecone Connection Errors**
   - Verify API key is correct
   - Check index name matches environment variable
   - Ensure index exists in Pinecone dashboard

2. **Document Upload Fails**
   - Check file size (max 10MB by default)
   - Verify file type is supported
   - Ensure admin has proper permissions

3. **Chat Not Finding Documents**
   - Verify documents uploaded successfully to Pinecone
   - Check user role matches document access role
   - Confirm Groq API key is working

### Debug Mode

Enable debug logging by setting in `.env`:
```bash
DEBUG=True
LOG_LEVEL=DEBUG
```

## 🏗️ Architecture

### Backend Components

1. **routes/admin.py**: Admin API endpoints
2. **routes/support.py**: Support chatbot, local context search, and document ingestion helpers (replaces docs/vectorstore.py)
3. **auth/**: Authentication and authorization
4. **config/db.py**: Database connections

### Frontend Components

1. **AdminDashboard.js**: Main admin interface
2. **Auth.js**: Authentication handling
3. Material-UI components for responsive design

### Data Flow

```
Upload File → Extract Text → Generate Chunks → 
Create Embeddings → Store in Pinecone → Save Metadata in MongoDB
```

### Chat Query Flow

```
User Question → Generate Query Embedding → 
Search Pinecone → Retrieve Context → Generate Response with Groq
```

## 🚦 Production Considerations

### Security

- Change default admin credentials
- Use strong JWT secret keys
- Implement rate limiting
- Validate file uploads thoroughly
- Use HTTPS in production

### Scaling

- Consider Pinecone pod types for performance
- Implement file upload limits
- Monitor Pinecone usage and costs
- Set up proper logging and monitoring

### Maintenance

- Regular backup of MongoDB data
- Monitor Pinecone index size
- Clean up old documents as needed
- Update dependencies regularly

## 📚 API Reference

### Admin Endpoints

- `GET /admin/dashboard` - Get system statistics
- `POST /admin/upload-documents` - Upload documents to Pinecone
- `GET /admin/knowledge-documents` - List uploaded documents
- `DELETE /admin/knowledge-documents/{doc_id}` - Delete document

### Authentication

All admin endpoints require:
- Valid JWT token in Authorization header
- User must have 'admin' role

### File Upload Format

```bash
POST /admin/upload-documents
Content-Type: multipart/form-data

files: [file1, file2, ...]  # Multiple files
role: "general"             # Role access level
description: "Optional description"
```

## 🎯 Next Steps

1. **Enhanced Search**: Implement semantic search with filters
2. **Document Versioning**: Track document updates and versions  
3. **Bulk Operations**: Support bulk upload and deletion
4. **Analytics**: Add usage analytics and search insights
5. **Integration**: Connect with external document sources

## 💡 Tips

- Start with general access documents for testing
- Use descriptive filenames and descriptions
- Monitor Pinecone usage to manage costs
- Regularly review and cleanup old documents
- Test chat functionality after each upload

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Verify all environment variables are set correctly
4. Test individual components (auth, Pinecone, MongoDB) separately
