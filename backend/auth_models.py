from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
from datetime import datetime, timezone
import uuid

# User Models
class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    role: Literal['admin', 'user'] = 'user'
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    role: Optional[Literal['admin', 'user']] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserInDB(User):
    password_hash: str

class UserResponse(User):
    pass

# Auth Models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    message: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None

class AuthContext(BaseModel):
    user: User
    token_data: TokenData