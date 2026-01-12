from enum import Enum
from token import OP
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from fastapi import Query

class DownloadType(str, Enum):
    PATH = "path"
    FILEID = "file_id"

class FileDownloadResponse(BaseModel):
    file_id: int
    filename: str
    file_size: Optional[int] = None
    file_type: str
    status: str
    deletion_date: datetime
    created_by: int
    created_at: datetime
    updated_at: datetime

class FileResponse(BaseModel):
    file_id: int
    filename: str
    file_size: Optional[int] = None
    file_type: str
    status: str
    deletion_date: datetime
    created_by: int
    created_at: datetime
    updated_at: datetime