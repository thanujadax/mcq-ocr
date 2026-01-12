from datetime import datetime
from app.models.marking_scheme import MarkingScheme
from app.models.template import Template, TemplateConfigType
from app.autograder.utils.image_processing import read_enhanced_image
from app.utils.file_handelling import save_json, file_exists, read_json

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarkingConfigJob:
    def __init__(self, data: dict):
        '''
        data is a dictionary with the following keys:
        data:
            id: int
            name: str
            template_path: str (relative path in NFS storage)
            marking_scheme_path: str (relative path in NFS storage)
            template_config_path: str (relative path in NFS storage)
            marking_config_path: str (relative path in NFS storage)
            config_type: str ('grid_based' or 'clustering_based')
            save_intermediate_results: bool
        '''
        self.id = data['id']
        self.name = data['name']
        self.template_path = data['template_path']
        self.marking_scheme_path = data['marking_scheme_path']
        self.template_config_path = data['template_config_path']
        self.marking_config_path = data['marking_config_path']
        self.config_type = data['config_type']
        self.save_intermediate_results = data['save_intermediate_results']
        self.template = None
        self.marking_scheme = None
        self.marking_config = None

    def configure(self):
        """
        Configure marking by processing template and marking scheme, then saving results to NFS storage
        """
        try:
            # Read and enhance template image
            template_img = read_enhanced_image(self.template_path, 1.5, resize=False)
            logger.info(f"Template image loaded from {self.template_path}")
            
            # Read and enhance marking scheme image
            marking_scheme_img = read_enhanced_image(self.marking_scheme_path, 1)
            logger.info(f"Marking scheme image loaded from {self.marking_scheme_path}")
            
            # Read template configuration
            template_config = read_json(self.template_config_path)
            logger.info(f"Template config loaded from {self.template_config_path}")
            
            # Create template object
            config_type = TemplateConfigType.GRID_BASED if self.config_type == 'grid_based' else TemplateConfigType.CLUSTERING_BASED
            self.template = Template(self.id, f'{self.name} Template', template_img, template_config, config_type)
            
            # Create marking scheme object
            self.marking_scheme = MarkingScheme(self.id, f'{self.name} Marking Scheme', marking_scheme_img, self.template)
            
            # Get answers and coordinates from marking scheme
            answers_with_coordinates = self.marking_scheme.get_answers_and_corresponding_points()
            
            # Create marking configuration
            self.marking_config = {
                'job_id': self.id,
                'job_name': self.name,
                'template_config_type': self.config_type,
                'answers_with_coordinates': answers_with_coordinates,
                'processed_at': datetime.now().isoformat()
            }
            
            # Save marking configuration to NFS storage
            save_json(
                self.marking_config, 
                self.marking_config_path
            )
            logger.info(f"Marking config saved to NFS storage at {self.marking_config_path}")
            
            # Validate that the configuration file was created successfully
            if not file_exists(self.marking_config_path):
                logger.error(f"Marking config file does not exist at {self.marking_config_path}")
                return False
            
            # Validate template config file exists
            if not file_exists(self.template_config_path):
                logger.error(f"Template config file does not exist at {self.template_config_path}")
                return False
            
            # Validate template image exists
            if not file_exists(self.template_path):
                logger.error(f"Template image file does not exist at {self.template_path}")
                return False
            
            # Validate marking scheme image exists
            if not file_exists(self.marking_scheme_path):
                logger.error(f"Marking scheme image file does not exist at {self.marking_scheme_path}")
                return False
            
            logger.info(f"Marking configuration completed successfully for job {self.id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to configure marking for job {self.id}: {str(e)}")
            return False

    def __str__(self):
        return f"MarkingConfigJob(id={self.id}, name={self.name})"
