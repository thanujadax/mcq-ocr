"""
Marking scheme configuration job processor.
Handles processing of marking scheme configuration jobs.
"""

import logging
from typing import Dict, Any, Optional, Callable, Union
from app.markingworker.processors.job_processor_interface import JobProcessorInterface
from app.models.marking_scheme_config_job import MarkingSchemeConfigJob


logger = logging.getLogger(__name__)


class MarkingSchemeConfigProcessor(JobProcessorInterface):
    """
    Processor for marking scheme configuration jobs.
    Handles the configuration of marking schemes.
    """
    
    def __init__(self, job_data: Dict[str, Any], progress_callback: Optional[Callable] = None):
        """
        Initialize the marking scheme config processor.
        
        Args:
            job_data: Dictionary containing marking scheme configuration parameters
            progress_callback: Optional callback function to report progress
        """
        super().__init__(job_data, progress_callback)
        self.marking_scheme_config_job: Optional[MarkingSchemeConfigJob] = None
    
    def validate(self) -> bool:
        """
        Validate the marking scheme configuration job data.
        
        Returns:
            True if job data is valid, False otherwise
        """
        # Required fields based on backend to_marking_scheme_config_job_data() structure
        required_fields = [
            'id',
            'name',
            'template_id',
            'template_path',
            'template_config_path',
            'config_type',
            'marking_scheme_path',
            'marking_scheme_config_path'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in self.job_data:
                missing_fields.append(field)
        
        if missing_fields:
            logger.error(f"Missing required fields in marking scheme config job {self.job_id}: {', '.join(missing_fields)}")
            return False
        
        return True
    
    def process(self) -> Union[Dict[str, Any], bool]:
        """
        Process the marking scheme configuration job.
        
        Returns:
            Dictionary containing marking scheme config results if successful, False otherwise
        """
        try:
            if not self.validate():
                logger.error(f"Marking scheme config job validation failed: {self.job_id}")
                return False
            
            logger.info(f"Processing marking scheme config job: {self.job_id}")
            
            # Create and configure the marking scheme
            self.marking_scheme_config_job = MarkingSchemeConfigJob(self.job_data)
            success = self.marking_scheme_config_job.configure()
            
            if success:
                result = {
                    'marking_scheme_path': self.marking_scheme_config_job.marking_scheme_path,
                    'marking_scheme_config_path': self.marking_scheme_config_job.marking_scheme_config_path,
                }
                logger.info(f"Marking scheme config job completed successfully: {self.job_id}")
                return result
            else:
                logger.error(f"Marking scheme config job failed: {self.job_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error processing marking scheme config job {self.job_id}: {e}")
            return False

