"""
Template model for MCQ templates.
"""

from sqlalchemy import Column, String, Text, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from .base import BaseModel

class TemplateConfigType(PyEnum):
    """Enum for template configuration type."""
    GRID_BASED = "grid_based"
    CLUSTERING_BASED = "clustering_based"

class TemplateConfigStatus(PyEnum):
    """Enum for template configuration job status."""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Template(BaseModel):
    """Template model for MCQ templates."""
    
    __tablename__ = "templates"
    
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    config_type = Column(Enum(TemplateConfigType), nullable=False)
    status = Column(Enum(TemplateConfigStatus), nullable=False, default=TemplateConfigStatus.QUEUED)
    
    # Template configuration
    num_questions = Column(Integer, nullable=False, default=0)
    options_per_question = Column(Integer, nullable=False, default=5)
    
    # Template configuration as JSON
    configuration_file_id = Column(Integer, ForeignKey("files_or_folders.id"), nullable=True)
    
    # File references
    template_file_id = Column(Integer, ForeignKey("files_or_folders.id"), nullable=True)
    
    # Foreign keys
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User", back_populates="templates")
    configuration_file = relationship("FileOrFolder", foreign_keys=[configuration_file_id], back_populates="template_configurations")
    template_file = relationship("FileOrFolder", foreign_keys=[template_file_id], back_populates="template_files")
    marking_jobs = relationship("MarkingJob", back_populates="template", cascade="all, delete-orphan")
    template_config_jobs = relationship("TemplateConfigJob", back_populates="template", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Template(id={self.id}, name='{self.name}', type='{self.config_type}')>"
