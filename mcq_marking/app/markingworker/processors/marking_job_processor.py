"""
Marking job processor.
Handles processing of marking jobs for answer sheets.
"""

import logging
from typing import Dict, Any, Optional, Callable, Union
from app.markingworker.processors.job_processor_interface import JobProcessorInterface
from app.models.marking_job import MarkingJob
from app.utils.EventRegistery import EventRegistery
from app.utils.ThreadSafeDict import ThreadSafeDict


logger = logging.getLogger(__name__)


class MarkingJobProcessor(JobProcessorInterface):
    """
    Processor for marking jobs.
    Handles the marking of student answer sheets.
    """
    
    def __init__(
        self, 
        job_data: Dict[str, Any], 
        progress_callback: Callable[[float], None],
        rabbitmq_url: Optional[str] = None,
        event_registery: EventRegistery = None,
        temp_data_store: ThreadSafeDict = None
    ):
        """
        Initialize the marking job processor.
        
        Args:
            job_data: Dictionary containing marking job parameters
            progress_callback: Optional callback function to report progress
            rabbitmq_url: RabbitMQ connection URL for publishing progress
        """
        super().__init__(job_data, progress_callback)
        self.rabbitmq_url = rabbitmq_url
        self.marking_job: Optional[MarkingJob] = None
        self.event_registery = event_registery
        self.temp_data_store = temp_data_store
    
    def validate(self) -> bool:
        """
        Validate the marking job data.
        
        Returns:
            True if job data is valid, False otherwise
        """
        # Required fields based on backend to_marking_job_data() structure
        required_fields = [
            'id',
            'name', 
            'template_path',
            'template_config_path',
            'config_type',
            'marking_scheme_path',
            'marking_scheme_config_path',
            'answers_folder_path',
            'result_sheet_file_path',
            'save_intermediate_results'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in self.job_data:
                missing_fields.append(field)
        
        if missing_fields:
            logger.error(f"Missing required fields in marking job {self.job_id}: {', '.join(missing_fields)}")
            return False
        
        return True
    
    def process(self) -> Union[Dict[str, Any], bool]:
        """
        Process the marking job.
        
        Returns:
            Dictionary with marking results if successful, False otherwise
        """
        try:
            if not self.validate():
                logger.error(f"Marking job validation failed: {self.job_id}")
                return False
            
            logger.info(f"Processing marking job: {self.job_id}")
            
            # Create and execute the marking job
            self.marking_job = MarkingJob(
                self.job_data,
                rabbitmq_url=self.rabbitmq_url,
                progress_callback=self.progress_callback,
                event_registery=self.event_registery,
                temp_data_store=self.temp_data_store
            )
            result = self.marking_job.mark_answers()
            
            if result:
                logger.info(f"Marking job completed successfully: {self.job_id}")
                # Return the actual result dictionary from mark_answers()
                return result
            else:
                logger.error(f"Marking job failed: {self.job_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error processing marking job {self.job_id}: {e}")
            return False

