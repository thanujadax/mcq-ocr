from enum import Enum

import cv2
import numpy as np
from app.autograder.utils.template_parameters import get_choice_distribution, get_coordinates_of_bubbles_grid,reconstruct_bubbles
from PIL import Image

import logging

from app.utils.file_handelling import save_image

logger = logging.getLogger(__name__)

class TemplateConfigType(Enum):
    GRID_BASED = "grid_based"
    CLUSTERING_BASED = "clustering_based"

class Template:
    def __init__(self, id : int, name: str, template_img : Image, template_config : dict, config_type : TemplateConfigType):
        self.id = id
        self.name = name
        self.template_img = template_img
        self.template_config = template_config
        self.config_type = config_type
        self.bubble_coordinates = None
        self.choice_distribution = None

    def get_bubble_coordinates(self, force_recalculate=False):
        if self.bubble_coordinates is None or force_recalculate:
            logger.info(f"Getting bubble coordinates. Config type: {self.config_type}")
            if self.config_type == TemplateConfigType.GRID_BASED:
                self.bubble_coordinates = get_coordinates_of_bubbles_grid(self.template_config)
            elif self.config_type == TemplateConfigType.CLUSTERING_BASED:
                # Flatten the 3D structure from reconstruct_bubbles
                nested_coords = reconstruct_bubbles(self.template_config)
                self.bubble_coordinates = []
                for column in nested_coords:
                    for row in column:
                        for coord in row:
                            self.bubble_coordinates.append(coord)
        
        # Draw bubble coordinates on the template image
        # TODO: Remove this
        template_img_copy = self.template_img.copy()
        # Convert PIL Image to numpy array for OpenCV
        template_img_array = np.array(template_img_copy)
        # Convert RGB to BGR for OpenCV
        template_img_array = cv2.cvtColor(template_img_array, cv2.COLOR_RGB2BGR)
        
        for coordinate in self.bubble_coordinates:
            # Convert coordinate to tuple of integers
            if isinstance(coordinate, (list, tuple)):
                coord_tuple = (int(coordinate[0]), int(coordinate[1]))
            else:
                coord_tuple = (int(coordinate[0]), int(coordinate[1]))
            cv2.circle(template_img_array, coord_tuple, 5, (0, 0, 255), -1)
        
        # Convert back to PIL Image for saving
        template_img_with_circles = Image.fromarray(cv2.cvtColor(template_img_array, cv2.COLOR_BGR2RGB))
        #save the template image
        save_image(f"intermediate/templates/template_img_with_bubble_coordinates_{self.id}.jpg", template_img_with_circles)
        
        return self.bubble_coordinates
    
    def get_choice_distribution(self, force_recalculate=False):
        if self.choice_distribution is None or force_recalculate:
          self.choice_distribution = get_choice_distribution(self.template_config)
        return self.choice_distribution

    def __str__(self):
        return f"Template(id={self.id}, name={self.name})"