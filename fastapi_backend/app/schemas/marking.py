from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field

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
    result_sheet_file_id: Optional[int] = None
    index_list_file_id: Optional[int] = None
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
    save_intermediate_results: bool
    total_answer_sheets: Optional[int] = None
    processed_answer_sheets: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    created_by: int

class ResultsData(MarkingResponseBasic):
    marking_config_id: int
    result_sheet_file_id: int
    processing_started_at: datetime
    processing_completed_at: datetime


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

class MarkingAttachIndexList(BaseModel):
    index_list_file_id: int

class UpdateMarkingSchemeConfigRequest(BaseModel):
    isUpdated: bool
    marking_scheme_config: Optional[dict[str, Any]] = None

class Bubble(BaseModel):
    marked: bool
    coordinates: list[float]  # [x, y] coordinates

class StudentResult(BaseModel):
    row_number: int
    index_number: str
    correct: list[int]
    incorrect: list[int]
    more_than_one_marked: list[int]
    not_marked: list[int]
    columnwise_total: Optional[list[int]] = None
    score: int
    flag: bool
    flag_reason: str
    answer_sheet_path: str
    labeled_points: list[list[Bubble]]
    is_resolved: bool = False

class UpdateResultRequest(BaseModel):
    result: StudentResult


class ProgressRequest(BaseModel):
    marking_job_ids: list[int]

class ProgressResponse(BaseModel):
    marking_job_id: int
    progress: float


