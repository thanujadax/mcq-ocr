from pydantic import BaseModel
from typing import Optional


class TokenResponse(BaseModel):
    message: str


class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None
    faculty_id: Optional[int] = None


class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    first_name: str
    last_name: str
    password: str
    faculty_id: int