#!/usr/bin/env python3
"""
Script to remove test users from the Financial RBAC RAG System
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.db import users_collection

def remove_test_users():
    """Remove test users that were created"""
    
    # List of test usernames to remove
    test_usernames = [
        "customer1",
        "analyst1", 
        "underwriter1",
        "admin1",
        "auditor1"
    ]
    
    print("🗑️  Removing test users...")
    print("=" * 50)
    
    removed_count = 0
    
    for username in test_usernames:
        # Check if user exists
        existing_user = users_collection.find_one({"username": username})
        
        if existing_user:
            # Remove the user
            result = users_collection.delete_one({"username": username})
            
            if result.deleted_count > 0:
                print(f"✅ Removed user: {username} (role: {existing_user.get('role', 'unknown')})")
                removed_count += 1
            else:
                print(f"❌ Failed to remove user: {username}")
        else:
            print(f"⚠️  User {username} not found, skipping...")
    
    print("=" * 50)
    print(f"🎯 Removed {removed_count} test users")
    
    # Show remaining users count
    remaining_users = users_collection.count_documents({})
    print(f"📊 Remaining users in database: {remaining_users}")
    
    return removed_count

def list_all_users():
    """List all users in the database"""
    print("\n📋 Current users in database:")
    print("=" * 50)
    
    users = users_collection.find({}, {"username": 1, "role": 1, "_id": 0})
    user_count = 0
    
    for user in users:
        print(f"   👤 {user['username']} - Role: {user.get('role', 'unknown')}")
        user_count += 1
    
    if user_count == 0:
        print("   (No users found)")
    
    print(f"\n📊 Total users: {user_count}")

def remove_all_users():
    """Remove ALL users from the database (use with caution!)"""
    print("\n⚠️  WARNING: This will remove ALL users from the database!")
    confirmation = input("Type 'YES' to confirm: ")
    
    if confirmation == "YES":
        result = users_collection.delete_many({})
        print(f"🗑️  Removed {result.deleted_count} users from database")
        return result.deleted_count
    else:
        print("❌ Operation cancelled")
        return 0

def main():
    """Main function"""
    print("🧹 User Management Tool")
    print("=" * 50)
    
    # Show current users
    list_all_users()
    
    # Ask what to do
    print("\nOptions:")
    print("1. Remove test users only")
    print("2. Remove ALL users (use with caution!)")
    print("3. Just show users and exit")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        remove_test_users()
        list_all_users()
    elif choice == "2":
        remove_all_users()
        list_all_users()
    elif choice == "3":
        print("👍 No changes made")
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()
