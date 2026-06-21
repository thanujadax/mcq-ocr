from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    faculty_id: Optional[int] = None

class UserRoleUpdate(BaseModel):
    role: str

class FacultyResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: str  # Will be UserRoles enum value as string
    verify_status: str  # Will be VerifyStatus enum value as string
    faculty_id: Optional[int]  # Made optional to support super user
    last_login: Optional[datetime]
    created_at: Optional[datetime]  # Made optional to support super user
    updated_at: Optional[datetime]  # Made optional to support super user
    
    class Config:
        from_attributes = True

class UserResponseWithFaculty(UserResponse):
    faculty: FacultyResponse
