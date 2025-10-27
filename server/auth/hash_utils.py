import bcrypt

def hash_password(password: str) -> str:
    """Hash a password for storing in the database"""
    try:
        # Ensure password is not longer than 72 bytes for bcrypt
        if len(password.encode('utf-8')) > 72:
            password = password[:72]
        
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    except Exception as e:
        print(f"Password hashing error: {e}")
        raise e

def verify_password(password: str, hashed: str) -> bool:
    """Verify a plaintext password against its hash"""
    try:
        # Ensure password is not longer than 72 bytes for bcrypt
        if len(password.encode('utf-8')) > 72:
            password = password[:72]
        
        return bcrypt.checkpw(
            password.encode('utf-8'), 
            hashed.encode('utf-8') if isinstance(hashed, str) else hashed
        )
    except Exception as e:
        print(f"Password verification error: {e}")
        return False