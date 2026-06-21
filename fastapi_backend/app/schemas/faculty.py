from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class FacultyCreate(BaseModel):
    name: str


class FacultyUpdate(BaseModel):
    name: Optional[str] = None


class FacultyResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class FacultyAdmin(BaseModel):
    first_name: str
    last_name: str
    email: str

    class Config:
        from_attributes = True
