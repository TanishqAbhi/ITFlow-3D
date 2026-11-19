from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRoleEnum


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    portal: Optional[str] = None  # "ADMIN", "STAFF", "CUSTOMER" for role matching


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    first_name: str
    last_name: str
    role: UserRoleEnum
    is_active: bool


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
