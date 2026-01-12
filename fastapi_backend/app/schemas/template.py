from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.models.template import TemplateConfigStatus, TemplateConfigType

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    config_type: TemplateConfigType
    template_file_id: int
    save_intermediate_results: bool = False
    
    # Additional fields for clustering-based configuration
    num_of_columns: Optional[int] = None
    num_of_rows_per_column: Optional[int] = None
    num_of_options_per_question: Optional[int] = None

class TemplateResponse(BaseModel):
    id: int
    name: str
    status: TemplateConfigStatus
    description: Optional[str] = None
    config_type: TemplateConfigType
    configuration_file_id: Optional[int] = None
    template_file_id: Optional[int] = None
    num_questions: int
    options_per_question: int
    created_at: datetime
    updated_at: datetime
    created_by: int