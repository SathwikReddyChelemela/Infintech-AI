#!/usr/bin/env python3
"""
Database Reset Script
This script will completely clear all data from the MongoDB database
"""

import os
import sys
from config.db import get_database

def reset_database():
    """Reset the entire database - remove all users, applications, and documents"""
    try:
        print("🔄 Connecting to database...")
        db = get_database()
        
        # Collections to clear
        collections_to_clear = ['users', 'applications', 'documents', 'audit_logs']
        
        print("⚠️  WARNING: This will delete ALL data in the database!")
        confirm = input("Type 'YES' to confirm database reset: ")
        
        if confirm != 'YES':
            print("❌ Database reset cancelled.")
            return False
        
        print("🗑️  Clearing database...")
        results = {}
        
        for collection_name in collections_to_clear:
            collection = db[collection_name]
            delete_result = collection.delete_many({})
            count = delete_result.deleted_count
            results[collection_name] = count
            print(f"   • {collection_name}: deleted {count} documents")
        
        print("✅ Database reset completed successfully!")
        print(f"📊 Total documents deleted: {sum(results.values())}")
        return True
        
    except Exception as e:
        print(f"❌ Error resetting database: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧹 RBAC Medical Assistant - Database Reset Tool")
    print("=" * 50)
    
    success = reset_database()
    
    if success:
        print("\n🎉 You can now create fresh users!")
        print("💡 Tip: Go to the app and register new users with different roles")
    else:
        print("\n💥 Database reset failed!")
        sys.exit(1)
