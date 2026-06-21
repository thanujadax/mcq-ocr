"""
MCQ Marking Worker module.
Provides job processing classes and RabbitMQ worker for MCQ marking system.
"""

from app.markingworker.processors.job_processor_interface import JobProcessorInterface
from app.markingworker.processors.template_config_processor import TemplateConfigProcessor
from app.markingworker.processors.marking_scheme_config_processor import MarkingSchemeConfigProcessor
from app.markingworker.processors.marking_job_processor import MarkingJobProcessor
from app.markingworker.markingworker import MCQMarkingWorker

__all__ = [
    'JobProcessorInterface',
    'TemplateConfigProcessor',
    'MarkingSchemeConfigProcessor',
    'MarkingJobProcessor',
    'MCQMarkingWorker',
]

