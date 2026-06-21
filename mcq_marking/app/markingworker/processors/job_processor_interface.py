"""
Abstract base class interface for job processors.
This defines the contract that all job processor classes must implement.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Callable, Union


class JobProcessorInterface(ABC):
    """
    Abstract base class for job processors.
    All job processor classes must inherit from this and implement the process method.
    """
    
    def __init__(self, job_data: Dict[str, Any], progress_callback: Optional[Callable] = None):
        """
        Initialize the job processor with job data and optional progress callback.
        
        Args:
            job_data: Dictionary containing job configuration and parameters
            progress_callback: Optional callback function to report progress
        """
        self.job_data = job_data
        self.progress_callback = progress_callback
        self.job_id = job_data.get('id', 'unknown')
    
    @abstractmethod
    def process(self) -> Union[Dict[str, Any], bool]:
        """
        Process the job and return the result.
        
        Returns:
            Dictionary with result data if successful, False otherwise
        """
        pass
    
    @abstractmethod
    def validate(self) -> bool:
        """
        Validate the job data before processing.
        
        Returns:
            True if job data is valid, False otherwise
        """
        pass
    
    def report_progress(self, completed: int, total: int) -> None:
        """
        Report progress to the backend if callback is available.
        
        Args:
            progress: Progress value between 0 and 1
        """
        if self.progress_callback:
            self.progress_callback(self.job_id, completed, total)

