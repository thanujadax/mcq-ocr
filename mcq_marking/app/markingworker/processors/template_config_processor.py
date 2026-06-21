"""
Template configuration job processor.
Handles processing of template configuration jobs.
"""

import logging
from typing import Dict, Any, Optional, Callable, Union
from app.markingworker.processors.job_processor_interface import JobProcessorInterface
from app.models.template_config_job import TemplateConfigJob


logger = logging.getLogger(__name__)


class TemplateConfigProcessor(JobProcessorInterface):
    """
    Processor for template configuration jobs.
    Handles the configuration of MCQ templates.
    """
    
    def __init__(self, job_data: Dict[str, Any], progress_callback: Optional[Callable] = None):
        """
        Initialize the template config processor.
        
        Args:
            job_data: Dictionary containing template configuration parameters
            progress_callback: Optional callback function to report progress
        """
        super().__init__(job_data, progress_callback)
        self.template_config_job: Optional[TemplateConfigJob] = None
    
    def validate(self) -> bool:
        """
        Validate the template configuration job data.
        
        Returns:
            True if job data is valid, False otherwise
        """
        # Required fields based on backend to_job_data() structure
        required_fields = [
            'id',
            'name',
            'config_type',
            'template_path',
            'template_config_path',
            'num_of_columns',
            'num_of_rows_per_column',
            'num_of_options_per_question'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in self.job_data:
                missing_fields.append(field)
        
        if missing_fields:
            logger.error(f"Missing required fields in template config job {self.job_id}: {', '.join(missing_fields)}")
            return False
        
        return True
    
    def process(self) -> Union[Dict[str, Any], bool]:
        """
        Process the template configuration job.
        
        Returns:
            Dictionary containing template config results if successful, False otherwise
        """
        try:
            if not self.validate():
                logger.error(f"Template config job validation failed: {self.job_id}")
                return False
            
            logger.info(f"Processing template config job: {self.job_id}")
            
            # Create and configure the template
            self.template_config_job = TemplateConfigJob(self.job_data)
            success = self.template_config_job.configure()
            
            if success:
                result = {
                    'template_config_path': self.template_config_job.template_config_path,
                    'output_image_path': self.template_config_job.output_image_path,
                    'debug_image_path': self.template_config_job.debug_image_path,
                    'bubble_config': self.template_config_job.template_config
                }
                logger.info(f"Template config job completed successfully: {self.job_id}")
                return result
            else:
                logger.error(f"Template config job failed: {self.job_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error processing template config job {self.job_id}: {e}")
            return False

