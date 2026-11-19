from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from app.models.user import UserRoleEnum


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None


class CustomerRegister(UserBase):
    password: str


class StaffCreate(UserBase):
    password: str
    employee_id: str
    department: str = "Product Operations"
    designation: str = "Operations Specialist"
    role: UserRoleEnum = UserRoleEnum.STAFF


class StaffUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = None
    is_suspended: Optional[bool] = None
    suspension_reason: Optional[str] = None


class StaffProfileResponse(BaseModel):
    id: int
    employee_id: str
    department: str
    designation: str
    performance_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerProfileResponse(BaseModel):
    id: int
    loyalty_tier: str
    total_spent: float
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: UserRoleEnum
    is_active: bool
    is_suspended: bool
    suspension_reason: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    staff_profile: Optional[StaffProfileResponse] = None
    customer_profile: Optional[CustomerProfileResponse] = None

    class Config:
        from_attributes = True
