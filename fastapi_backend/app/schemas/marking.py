from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel

from app.models.marking_job import MarkingJobPriority, MarkingJobStatus

class MarkingResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: MarkingJobStatus
    priority: MarkingJobPriority
    template_id: int
    marking_scheme_id: Optional[int] = None
    marking_config_id: Optional[int] = None
    answer_sheets_folder_id: Optional[int] = None
    save_intermediate_results: bool
    total_answer_sheets: Optional[int] = None
    processed_answer_sheets: Optional[int] = None
    failed_answer_sheets: Optional[int] = None
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    error_details: Optional[dict] = None
    results_summary: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    created_by: int

class MarkingResponseBasic(BaseModel):
    id: int
    name: str
    status: MarkingJobStatus
    priority: MarkingJobPriority
    template_name: str
    created_at: datetime
    updated_at: datetime
    created_by: int

class MarkingCreateMetadata(BaseModel):
    name: str
    description: str
    template_id: int
    save_intermediate_results: bool
    priority: MarkingJobPriority

class MarkingCreateMarkingScheme(BaseModel):
    marking_job_id: int
    marking_scheme_id: int

class MarkingCreateAnswerSheets(BaseModel):
    marking_job_id: int
    answer_sheets_folder_id: int

class MarkingAttachScheme(BaseModel):
    marking_scheme_id: int

class MarkingAttachAnswerSheets(BaseModel):
    answer_sheets_folder_id: int

class UpdateMarkingSchemeConfigRequest(BaseModel):
    marking_scheme_config: dict[str, Any]