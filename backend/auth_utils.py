import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from auth_models import TokenData, UserInDB
import os

# JWT Configuration
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Password Hashing Functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# JWT Token Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[TokenData]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None:
            return None
        
        return TokenData(user_id=user_id, email=email)
    except jwt.PyJWTError:
        return None

# User Authentication Helper
def authenticate_user(users_db, email: str, password: str) -> Optional[UserInDB]:
    """Authenticate a user by email and password"""
    # This will be implemented with actual database lookup
    pass

# Database Helper Functions
def prepare_user_for_mongo(user_data: dict) -> dict:
    """Prepare user data for MongoDB storage"""
    if isinstance(user_data.get('created_at'), datetime):
        user_data['created_at'] = user_data['created_at'].isoformat()
    if isinstance(user_data.get('updated_at'), datetime):
        user_data['updated_at'] = user_data['updated_at'].isoformat()
    return user_data

def parse_user_from_mongo(user_data: dict) -> dict:
    """Parse user data from MongoDB"""
    if isinstance(user_data.get('created_at'), str):
        user_data['created_at'] = datetime.fromisoformat(user_data['created_at'].replace('Z', '+00:00'))
    if isinstance(user_data.get('updated_at'), str):
        user_data['updated_at'] = datetime.fromisoformat(user_data['updated_at'].replace('Z', '+00:00'))
    return user_data