from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.marking_job import MarkingJobStatus, MarkingJobPriority
from app.models.template import TemplateConfigType, TemplateConfigStatus


class KeyStatsResponse(BaseModel):
    total_users: int
    active_templates: int
    completed_marking_jobs: int
    completion_rate: float


class RecentMarkingJobResponse(BaseModel):
    id: int
    name: str
    status: MarkingJobStatus
    priority: MarkingJobPriority
    total_answer_sheets: Optional[int] = None
    processed_answer_sheets: Optional[int] = None
    failed_answer_sheets: Optional[int] = None
    progress_percentage: float
    created_at: datetime
    template_name: str


class RecentTemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    config_type: TemplateConfigType
    status: TemplateConfigStatus
    num_questions: int
    created_at: datetime


class ConfigTypeComparison(BaseModel):
    config_type: str
    template_count: int
    marking_job_count: int
    completed_jobs: int
    failed_jobs: int
    completion_rate: float
    avg_completion_time_seconds: Optional[float] = None


class UserActivityResponse(BaseModel):
    activity_type: str  # "template_created", "marking_job_created", "marking_job_completed"
    description: str
    timestamp: datetime
    related_id: int
    related_name: str


class DashboardStatsResponse(BaseModel):
    user_name: str
    key_stats: KeyStatsResponse
    recent_marking_jobs: List[RecentMarkingJobResponse]
    recent_templates: List[RecentTemplateResponse]
    config_type_comparison: List[ConfigTypeComparison]
    user_activities: List[UserActivityResponse]
