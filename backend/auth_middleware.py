from fastapi import Request, HTTPException, Depends, Cookie, status
from fastapi.security import HTTPBearer
from typing import Optional
from auth_models import User, UserInDB, TokenData
from auth_utils import verify_token, parse_user_from_mongo
import os

security = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    token: Optional[str] = Cookie(None, alias="access_token"),
    db = None
) -> User:
    """Get the current authenticated user from cookie token"""
    
    # Get database from request state
    if db is None:
        db = request.app.state.db
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    # Verify token
    token_data: TokenData = verify_token(token)
    if token_data is None or token_data.user_id is None:
        raise credentials_exception
    
    # Get user from database
    user_data = await db.users.find_one({"id": token_data.user_id})
    if user_data is None:
        raise credentials_exception
    
    # Parse user data from MongoDB
    user_data = parse_user_from_mongo(user_data)
    user = User(**user_data)
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user (wrapper for dependency injection)"""
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current user and verify admin role"""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Optional dependency for routes that may or may not require authentication
async def get_current_user_optional(
    request: Request,
    token: Optional[str] = Cookie(None, alias="access_token")
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    try:
        return await get_current_user(request, token)
    except HTTPException:
        return None