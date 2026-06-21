"""
MarkingJob model for handling MCQ answer sheet marking operations.
"""

from sqlalchemy import Column, String, Text, Integer, Float, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from .base import BaseModel


class MarkingJobStatus(PyEnum):
    """Enum for marking job status."""
    INITIALIZED = "initialized"
    MARKING_SCHEME_CONFIGURED = "marking_scheme_configured"
    MARKING_SCHEME_VERIFIED = "marking_scheme_verified"
    ANSWER_SHEETS_ATTACHED = "answer_sheets_attached"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class MarkingJobPriority(PyEnum):
    """Enum for marking job priority."""
    NORMAL = "normal"
    URGENT = "urgent"


class MarkingJob(BaseModel):
    """
    MarkingJob model for handling MCQ answer sheet marking operations.
    
    This model tracks marking jobs that process answer sheets against templates
    and marking schemes to produce scores and results.
    """
    
    __tablename__ = "marking_jobs"

    # Basic job information
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Job status and priority
    status = Column(Enum(MarkingJobStatus), nullable=False, default=MarkingJobStatus.INITIALIZED)
    priority = Column(Enum(MarkingJobPriority), nullable=False, default=MarkingJobPriority.NORMAL)

    # File references and paths
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    marking_scheme_id = Column(Integer, ForeignKey("files_or_folders.id"), nullable=True)
    marking_config_id = Column(Integer, ForeignKey("files_or_folders.id"), nullable=True)
    answer_sheets_folder_id = Column(Integer, ForeignKey("files_or_folders.id"), nullable=True)
    result_sheet_file_id = Column(Integer, ForeignKey("files_or_folders.id"), nullable=True)
    intermediate_results_file_id = Column(Integer, ForeignKey("files_or_folders.id"), nullable=True)
    index_list_file_id = Column(Integer, ForeignKey("files_or_folders.id"), nullable=True)

    # Output paths
    marking_config_file_path = Column(String(500), nullable=True)
    result_sheet_file_path = Column(String(500), nullable=False, default='pending')
    intermediate_results_path = Column(String(500), nullable=True)


    # Processing settings
    save_intermediate_results = Column(Boolean, default=False, nullable=False)

    # Job metrics and results
    total_answer_sheets = Column(Integer, nullable=True)
    processed_answer_sheets = Column(Integer, default=0, nullable=True)
    failed_answer_sheets = Column(Integer, default=0, nullable=True)

    # Processing time tracking
    processing_started_at = Column(String(50), nullable=True)  # ISO datetime string
    processing_completed_at = Column(String(50), nullable=True)  # ISO datetime string

    # Error handling
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)  # Store structured error information

    # Results summary
    results_summary = Column(JSON, nullable=True)  # Store aggregate results

    # Foreign keys
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User", back_populates="marking_jobs")
    template = relationship("Template", back_populates="marking_jobs")
    marking_scheme = relationship("FileOrFolder", foreign_keys=[marking_scheme_id])
    marking_config = relationship("FileOrFolder", foreign_keys=[marking_config_id])
    answer_sheets_folder = relationship("FileOrFolder", foreign_keys=[answer_sheets_folder_id])
    index_list_file_path = relationship("FileOrFolder", foreign_keys=[index_list_file_id])
    result_sheet_file = relationship("FileOrFolder", foreign_keys=[result_sheet_file_id])
    def __repr__(self):
        return f"<MarkingJob(id={self.id}, name='{self.name}', status='{self.status}')>"
    
    @property
    def completion_percentage(self) -> float:
        """Calculate completion percentage."""
        if not self.total_answer_sheets or self.total_answer_sheets == 0:
            return 0.0
        return (self.processed_answer_sheets / self.total_answer_sheets) * 100
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate of processed answer sheets."""
        total_processed = self.processed_answer_sheets + self.failed_answer_sheets
        if total_processed == 0:
            return 0.0
        return (self.processed_answer_sheets / total_processed) * 100
    
    @property
    def is_completed(self) -> bool:
        """Check if the job is completed."""
        return self.status == MarkingJobStatus.COMPLETED
    
    @property
    def is_failed(self) -> bool:
        """Check if the job has failed."""
        return self.status == MarkingJobStatus.FAILED
    
    @property
    def can_retry(self) -> bool:
        """Check if the job can be retried."""
        return self.status == MarkingJobStatus.FAILED

    def to_marking_scheme_config_job_data(self) -> dict:
        """Convert to marking scheme configuration job data format for RabbitMQ processing."""
        # Validate required paths
        if not self.template or not self.template.template_file or not self.template.template_file.path:
            raise ValueError("Template file path is required")
        
        if not self.template.configuration_file or not self.template.configuration_file.path:
            raise ValueError("Template configuration file path is required")
        
        if not self.marking_scheme or not self.marking_scheme.path:
            raise ValueError("Marking scheme file path is required")
        
        if not self.marking_config_file_path:
            raise ValueError("Marking config file path is required")
        
        return {
            'id': self.id,
            'name': self.name,
            'template_id': self.template_id,
            'template_path': self.template.template_file.path,
            'template_config_path': self.template.configuration_file.path,
            'config_type': self.template.config_type.value,
            'marking_scheme_path': self.marking_scheme.path,
            'marking_scheme_config_path': self.marking_config_file_path,
            'save_intermediate_results': self.save_intermediate_results
        }
    
    def to_marking_job_data(self) -> dict:
        """Convert to job data format for RabbitMQ processing."""
        return {
            'id': self.id,
            'name': self.name,
            'template_id': self.template_id,
            'template_path': self.template.template_file.path,
            'template_config_path': self.template.configuration_file.path,
            'config_type': self.template.config_type.value,
            'marking_scheme_path': self.marking_scheme.path if self.marking_scheme else None,
            'marking_scheme_config_path': self.marking_config_file_path,
            'answers_folder_path': self.answer_sheets_folder.path if self.answer_sheets_folder else None,
            'result_sheet_file_path': self.result_sheet_file_path,
            'intermediate_results_path': self.intermediate_results_path,
            'index_list_file_path': self.index_list_file_path.path if self.index_list_file_path else None,
            'save_intermediate_results': self.save_intermediate_results
        }
    
    def update_progress(self, processed: int, failed: int = 0):
        """Update job progress."""
        self.processed_answer_sheets = processed
        self.failed_answer_sheets = failed
        
        # Update status based on progress
        if self.total_answer_sheets and processed + failed >= self.total_answer_sheets:
            if failed == 0:
                self.status = MarkingJobStatus.COMPLETED
            else:
                # Determine if we should mark as completed or failed based on success rate
                success_rate = (processed / (processed + failed)) * 100
                if success_rate >= 50:  # At least 50% success rate
                    self.status = MarkingJobStatus.COMPLETED
                else:
                    self.status = MarkingJobStatus.FAILED
