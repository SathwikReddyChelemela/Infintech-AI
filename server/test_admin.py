#!/usr/bin/env python3
"""
Test script for admin functionality
This script tests the admin endpoints and Pinecone integration
"""

import requests
import json
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "admin@medical.com"
TEST_USER_PASSWORD = "admin123"

def test_admin_login():
    """Test admin login"""
    print("Testing admin login...")
    
    login_data = {
        "username": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    
    if response.status_code == 200:
        token_data = response.json()
        print("✅ Admin login successful")
        return token_data["access_token"]
    else:
        print(f"❌ Admin login failed: {response.status_code}")
        print(response.text)
        return None

def test_dashboard_stats(token):
    """Test dashboard statistics endpoint"""
    print("\nTesting dashboard statistics...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/dashboard", headers=headers)
    
    if response.status_code == 200:
        stats = response.json()
        print("✅ Dashboard stats retrieved successfully")
        print(f"   Total Applications: {stats['system_stats']['total_applications']}")
        print(f"   Total Users: {stats['system_stats']['total_users']}")
        return True
    else:
        print(f"❌ Dashboard stats failed: {response.status_code}")
        print(response.text)
        return False

def test_knowledge_documents_list(token):
    """Test knowledge documents listing"""
    print("\nTesting knowledge documents listing...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/knowledge-documents", headers=headers)
    
    if response.status_code == 200:
        docs = response.json()
        print("✅ Knowledge documents listed successfully")
        print(f"   Found {len(docs['documents'])} documents")
        return docs['documents']
    else:
        print(f"❌ Knowledge documents listing failed: {response.status_code}")
        print(response.text)
        return []

def test_document_upload(token):
    """Test document upload to Pinecone"""
    print("\nTesting document upload...")
    
    # Create a test document
    test_content = """
    Medical Insurance Test Document
    
    This is a test document for the medical insurance knowledge base.
    It contains sample information about:
    
    1. Policy Coverage
    - Medical procedures coverage
    - Emergency care benefits
    - Prescription drug coverage
    
    2. Claims Process
    - How to file a claim
    - Required documentation
    - Processing timelines
    
    3. Customer Support
    - Contact information
    - Business hours
    - Online portal access
    """
    
    test_file_path = Path("test_document.txt")
    with open(test_file_path, "w") as f:
        f.write(test_content)
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        with open(test_file_path, "rb") as f:
            files = {"files": (test_file_path.name, f, "text/plain")}
            data = {
                "role": "general",
                "description": "Test document for admin functionality"
            }
            
            response = requests.post(
                f"{BASE_URL}/admin/upload-documents",
                files=files,
                data=data,
                headers=headers
            )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Document upload successful")
            print(f"   Upload ID: {result.get('upload_id')}")
            print(f"   Message: {result.get('message')}")
            return True
        else:
            print(f"❌ Document upload failed: {response.status_code}")
            print(response.text)
            return False
            
    finally:
        # Clean up test file
        if test_file_path.exists():
            test_file_path.unlink()

def main():
    """Run all admin tests"""
    print("🧪 Starting Admin Functionality Tests")
    print("=" * 50)
    
    # Test login
    token = test_admin_login()
    if not token:
        print("❌ Cannot proceed without admin token")
        return
    
    # Test dashboard stats
    test_dashboard_stats(token)
    
    # Test knowledge documents listing
    test_knowledge_documents_list(token)
    
    # Test document upload
    test_document_upload(token)
    
    print("\n" + "=" * 50)
    print("🎉 Admin functionality tests completed!")
    print("\nNext steps:")
    print("1. Check the frontend admin dashboard")
    print("2. Verify documents appear in Pinecone")
    print("3. Test document search in chat")

if __name__ == "__main__":
    main()
