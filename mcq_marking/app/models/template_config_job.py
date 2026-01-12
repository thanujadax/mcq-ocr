from app.templateconfig.config import get_config
from app.templateconfig.clustering import get_clustering
from app.utils.file_handelling import save_image, save_json, file_exists


import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TemplateConfigJob:
    def __init__(self, data: dict):
        '''
        data is a dictionary with the following keys:
        data:
            id: int
            name: str
            template_path: str (relative path in NFS storage)
            template_config_path: str (relative path in NFS storage)
            output_image_path: str (relative path in NFS storage)
            debug_image_path: str (relative path in NFS storage)
        '''
        self.id = data['id']
        self.name = data['name']
        self.config_type = data['config_type']
        self.template_path = data['template_path']
        self.template_config_path = data['template_config_path']
        self.output_image_path = data['output_image_path']
        self.debug_image_path = data['debug_image_path']
        self.num_of_columns = data.get('num_of_columns',None)
        self.num_of_rows_per_column = data.get('num_of_rows_per_column',None)
        self.num_of_options_per_question = data.get('num_of_options_per_question',None)
        self.save_intermediate_results = data['save_intermediate_results']
        self.template_config = None
        self.warped_img = None
        self.debug_img = None

    def configure(self):
        """
        Configure template by processing the image and saving results to NFS storage
        """
        # Get configuration using NFS-aware function
        if self.config_type == 'grid_based':
            bubble_configs, warped_img, result_img = get_config(
                self.template_path, 
                self.save_intermediate_results
            )
        elif self.config_type == 'clustering_based':
            bubble_configs, warped_img, result_img = get_clustering(
                self.template_path, 
                self.num_of_columns,
                self.num_of_rows_per_column,
                self.num_of_options_per_question,
                self.save_intermediate_results
            )
        self.template_config = bubble_configs
        self.warped_img = warped_img
        self.debug_img = result_img
                
        # Save configuration JSON to NFS storage
        save_json(
            self.template_config, 
            self.template_config_path
        )
        logger.info(f"Template config saved to NFS storage")
        
        # Save warped image to NFS storage 
        
        save_image(
            self.output_image_path, 
            warped_img
        )
        logger.info(f"Warped image saved to NFS storage")

        # Save result image to NFS storage
        if self.debug_img is not None:
            save_image(
                self.debug_image_path, 
                self.debug_img
            )
            logger.info(f"Result image saved to NFS storage")
        else:
            logger.info("Result image is None, skipping save")

        #Check files exist
        if not file_exists(self.template_config_path):
            logger.error(f"Template config file does not exist")
            return False
        if not file_exists(self.output_image_path):
            logger.error(f"Output image file does not exist")
            return False
        if self.debug_img is not None and self.debug_image_path is not None and not file_exists(self.debug_image_path):
            logger.error(f"Result image file does not exist")
            return False
        
        return True
            

    def __str__(self):
        return f"TemplateConfigJob(id={self.id}, name={self.name})"