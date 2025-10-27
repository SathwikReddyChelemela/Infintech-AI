#!/usr/bin/env python3
"""
Script to create test users for the Financial RBAC RAG System
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from auth.hash_utils import hash_password
from config.db import users_collection

def create_test_users():
    """Create test users for different roles"""
    
    # Test users data
    test_users = [
        {
            "username": "customer1",
            "password": hash_password("password123"),
            "role": "customer"
        },
        {
            "username": "analyst1", 
            "password": hash_password("password123"),
            "role": "analyst"
        },
        {
            "username": "underwriter1",
            "password": hash_password("password123"), 
            "role": "underwriter"
        },
        {
            "username": "admin1",
            "password": hash_password("password123"),
            "role": "admin"
        },
        {
            "username": "auditor1",
            "password": hash_password("password123"),
            "role": "auditor"
        }
    ]
    
    # Check if users already exist
    for user_data in test_users:
        existing_user = users_collection.find_one({"username": user_data["username"]})
        if existing_user:
            print(f"User {user_data['username']} already exists, skipping...")
        else:
            users_collection.insert_one(user_data)
            print(f"Created user: {user_data['username']} with role: {user_data['role']}")
    
    print("\nTest users created successfully!")
    print("You can now log in with any of these credentials:")
    for user_data in test_users:
        print(f"  Username: {user_data['username']}, Password: password123, Role: {user_data['role']}")

if __name__ == "__main__":
    try:
        create_test_users()
    except Exception as e:
        print(f"Error creating test users: {e}")
        print("Make sure the MongoDB connection is working and the database is accessible.")

