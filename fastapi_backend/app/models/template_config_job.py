"""
TemplateConfigJob model for handling template configuration operations.
"""

from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Enum,JSON
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from app.models.template import TemplateConfigStatus
from .base import BaseModel


class TemplateConfigJobPriority(PyEnum):
    """Enum for template configuration job priority."""
    NORMAL = "normal"
    URGENT = "urgent"




class TemplateConfigJob(BaseModel):
    """
    TemplateConfigJob model for handling template configuration operations.
    
    This model tracks jobs that process template images to extract bubble
    configurations and generate template configuration files.
    """
    
    __tablename__ = "template_config_jobs"
    
    # Basic job information
    name = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=True)
    
    # Job priority
    priority = Column(Enum(TemplateConfigJobPriority), nullable=False, default=TemplateConfigJobPriority.NORMAL)
    
    
    # File paths (relative to NFS storage)
    template_path = Column(String(500), nullable=False)  # Input template image
    template_config_path = Column(String(500), nullable=False)  # Output config JSON
    output_image_path = Column(String(500), nullable=False)  # Warped/processed image
    debug_image_path = Column(String(500), nullable=True)  # Debug/result image with annotations

    # Clustering-based configuration parameters
    num_of_columns = Column(Integer, nullable=True)
    num_of_rows_per_column = Column(JSON, nullable=True)
    num_of_options_per_question = Column(Integer, nullable=True)

    # Processing settings
    save_intermediate_results = Column(Boolean, default=False, nullable=False)

    # Image processing metrics
    original_image_width = Column(Integer, nullable=True)
    original_image_height = Column(Integer, nullable=True)
    processed_image_width = Column(Integer, nullable=True)
    processed_image_height = Column(Integer, nullable=True)

    # Processing time tracking
    processing_started_at = Column(String(50), nullable=True)  # ISO datetime string
    processing_completed_at = Column(String(50), nullable=True)  # ISO datetime string

    # Foreign keys
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)

    # Relationships
    created_by_user = relationship("User", back_populates="template_config_jobs")
    template = relationship("Template", back_populates="template_config_jobs")
    
    def __repr__(self):
        return f"<TemplateConfigJob(id={self.job_id}, name='{self.name}')>"

    def get_status(self) -> TemplateConfigStatus:
        """Get the status of the job."""
        return self.template.status

    def to_job_data(self) -> dict:
        """Convert to job data format for RabbitMQ processing."""
        try:
            config_type = 'grid_based'  # Default value
            if self.template and self.template.config_type:
                config_type = self.template.config_type.value
            
            return {
                'id': self.id,
                'name': self.name,
                'config_type': config_type,
                'template_path': self.template_path,
                'template_config_path': self.template_config_path,
                'output_image_path': self.output_image_path,
                'debug_image_path': self.debug_image_path,
                'num_of_columns': self.num_of_columns,
                'num_of_rows_per_column': self.num_of_rows_per_column,
                'num_of_options_per_question': self.num_of_options_per_question,
                'save_intermediate_results': self.save_intermediate_results
            }
        except Exception as e:
            # Log the error and return a safe default
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in to_job_data for job {self.id}: {e}")
            raise e

    def update_image_dimensions(self, 
                              original_width: int, 
                              original_height: int,
                              processed_width: int = None, 
                              processed_height: int = None):
        """Update image dimension information."""
        self.original_image_width = original_width
        self.original_image_height = original_height

        if processed_width is not None:
            self.processed_image_width = processed_width

        if processed_height is not None:
            self.processed_image_height = processed_height

    def mark_as_failed(self, error_message: str, error_details: dict = None):
        """Mark the job as failed with error information."""
        self.template.status = TemplateConfigStatus.FAILED

    def mark_as_completed(self):
        """Mark the job as completed."""
        self.template.status = TemplateConfigStatus.COMPLETED
