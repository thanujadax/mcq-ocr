"""
Job processors module.
Contains all job processor implementations.
"""

from app.markingworker.processors.job_processor_interface import JobProcessorInterface
from app.markingworker.processors.template_config_processor import TemplateConfigProcessor
from app.markingworker.processors.marking_scheme_config_processor import MarkingSchemeConfigProcessor
from app.markingworker.processors.marking_job_processor import MarkingJobProcessor

__all__ = [
    'JobProcessorInterface',
    'TemplateConfigProcessor',
    'MarkingSchemeConfigProcessor',
    'MarkingJobProcessor',
]

