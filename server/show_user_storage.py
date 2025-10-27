#!/usr/bin/env python3
"""
Script to show where user data is stored and current database information
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.db import users_collection, db, client
import os
from dotenv import load_dotenv
from pathlib import Path

# Ensure single env source: server/.env
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

def show_database_info():
    """Show detailed information about where user data is stored"""
    
    print("📊 DATABASE STORAGE INFORMATION")
    print("=" * 60)
    
    # Environment variables
    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME")
    
    print(f"🔗 MongoDB Connection URI: {mongo_uri}")
    print(f"📝 Database Name: {db_name}")
    print(f"👥 Users Collection: {db_name}.users")
    
    # Connection details
    print("\n🏗️ INFRASTRUCTURE DETAILS")
    print("=" * 60)
    
    if "cluster0.30sj19a.mongodb.net" in mongo_uri:
        print("☁️  Storage Type: MongoDB Atlas (Cloud Database)")
        print("🌍 Provider: MongoDB Atlas")
        print("🔐 Authentication: Username/Password")
        print("📍 Cluster: cluster0.30sj19a")
        print("🗄️  Database Engine: MongoDB")
    else:
        print("💾 Storage Type: Local/Custom MongoDB")
    
    # Collection information
    print(f"\n📂 COLLECTION STRUCTURE")
    print("=" * 60)
    print(f"Collection Name: users")
    print(f"Full Path: {db_name}.users")
    print(f"Indexes:")
    print(f"  - username (unique)")
    print(f"  - role")
    
    # Current users
    try:
        user_count = users_collection.count_documents({})
        print(f"\n👤 CURRENT USER DATA")
        print("=" * 60)
        print(f"Total Users: {user_count}")
        
        if user_count > 0:
            print(f"\nUsers in database:")
            users = users_collection.find({}, {"username": 1, "role": 1, "_id": 0})
            for user in users:
                print(f"  • {user['username']} (Role: {user.get('role', 'unknown')})")
        else:
            print("No users found in database")
            
    except Exception as e:
        print(f"❌ Error accessing user data: {e}")
    
    # Storage format
    print(f"\n💾 DATA FORMAT")
    print("=" * 60)
    print("Each user document contains:")
    print("  - username: string (unique identifier)")
    print("  - password: string (bcrypt hashed)")  
    print("  - role: string (customer/analyst/underwriter/admin/auditor)")
    print("  - _id: ObjectId (MongoDB auto-generated)")
    
    # Access information
    print(f"\n🔑 ACCESS INFORMATION")
    print("=" * 60)
    print("To access this data you need:")
    print("1. MongoDB Atlas account credentials")
    print("2. Network access (IP whitelist)")
    print("3. Database connection string")
    print("4. Proper authentication")
    
    print(f"\n🛠️  MANAGEMENT TOOLS")
    print("=" * 60)
    print("You can manage users through:")
    print("1. This application's API endpoints")
    print("2. MongoDB Atlas web interface")
    print("3. MongoDB Compass (GUI tool)")
    print("4. MongoDB CLI tools")
    print("5. Custom scripts (like this one)")

def show_connection_test():
    """Test the database connection"""
    print(f"\n🧪 CONNECTION TEST")
    print("=" * 60)
    
    try:
        # Test connection
        client.admin.command('ping')
        print("✅ Database connection: SUCCESS")
        
        # Test users collection access
        users_collection.count_documents({})
        print("✅ Users collection access: SUCCESS")
        
        print("🎉 All database operations are working correctly!")
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

def main():
    """Main function"""
    show_database_info()
    show_connection_test()
    
    print(f"\n" + "=" * 60)
    print("💡 SUMMARY")
    print("=" * 60)
    print("Your user data is stored in:")
    print(f"  📍 MongoDB Atlas Cloud Database")
    print(f"  🗄️  Database: {os.getenv('DB_NAME')}")
    print(f"  📂 Collection: users")
    print(f"  🔐 Secured with bcrypt password hashing")
    print(f"  ☁️  Accessible from anywhere with credentials")

if __name__ == "__main__":
    main()
