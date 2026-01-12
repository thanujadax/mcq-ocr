from datetime import datetime
from pydantic import BaseModel


class UserCreate(BaseModel):
  email: str
  first_name: str
  last_name: str
  password: str

class UserUpdate(BaseModel):
  first_name: str
  last_name: str
  is_superuser: str

class UserResponse(BaseModel):
  id: int
  email: str
  first_name: str
  last_name: str
  is_active: bool
  is_superuser: bool
  last_login: datetime