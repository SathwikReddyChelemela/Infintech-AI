#!/usr/bin/env python3
"""
Script to update all files from authenticate to get_current_user for JWT migration
"""

import os
import re
from pathlib import Path

# Files to update
files_to_update = [
    "/Users/sathwik/Desktop/intel/rbac-medicalAssistant-main/server/main.py",
    "/Users/sathwik/Desktop/intel/rbac-medicalAssistant-main/server/routes/customer.py", 
    "/Users/sathwik/Desktop/intel/rbac-medicalAssistant-main/server/routes/analyst.py",
    "/Users/sathwik/Desktop/intel/rbac-medicalAssistant-main/server/routes/underwriter.py",
    "/Users/sathwik/Desktop/intel/rbac-medicalAssistant-main/server/docs/routes.py"
]

def update_file(file_path):
    """Update a single file to use get_current_user instead of authenticate"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Replace imports
        content = re.sub(
            r'from auth\.routes import authenticate',
            'from auth.routes import get_current_user',
            content
        )
        
        # Replace function dependencies
        content = re.sub(
            r'user=Depends\(authenticate\)',
            'user=Depends(get_current_user)',
            content
        )
        
        # Also handle cases where authenticate is in different positions
        content = re.sub(
            r'Depends\(authenticate\)',
            'Depends(get_current_user)',
            content
        )
        
        with open(file_path, 'w') as f:
            f.write(content)
        
        print(f"✅ Updated {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating {file_path}: {e}")
        return False

def main():
    print("🔄 Migrating authentication from BasicAuth to JWT...")
    print("=" * 60)
    
    success_count = 0
    
    for file_path in files_to_update:
        if os.path.exists(file_path):
            if update_file(file_path):
                success_count += 1
        else:
            print(f"⚠️  File not found: {file_path}")
    
    print("=" * 60)
    print(f"✅ Successfully updated {success_count}/{len(files_to_update)} files")
    print("🎉 JWT migration completed!")

if __name__ == "__main__":
    main()
