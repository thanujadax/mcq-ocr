from .LineBasedIndexSectionDetector import BlurCannyConfig, HoughLineConfig
import numpy as np
## Parameters
class Config:
    OPERATING_WIDTH = 1000
    OPERATING_HEIGHT = 1500
    OUTPUT_WIDTH = 300
    OUTPUT_HEIGHT = 60
    EDGE_DETECTION_PARAMS_1 = BlurCannyConfig(
        blur_spread=5,
        blur_strength=2,
        canny_threshold1=200,
        canny_threshold2=450
    )
    MORPH_KERNEL_SIZE = 5  # Size of the morphological operation kernel
    EDGE_DETECTION_PARAMS_2 = BlurCannyConfig(
        blur_spread=5,
        blur_strength=2,
        canny_threshold1=20,
        canny_threshold2=200
    )
    MIN_CONTOUR_AREA = 10000
    MAX_CONTOUR_AREA = 50000
    CONTOUR_MARGIN = 4
    VERTICAL_LINE_DETECTION_PARAMS = HoughLineConfig(
        threshold=30,
        angle_tolerance=np.pi/64,
        rho_resolution=1,
        theta_resolution=np.pi/64
    )
    HORIZONTAL_LINE_DETECTION_PARAMS = HoughLineConfig(
        threshold=100,
        angle_tolerance=np.pi/100,
        rho_resolution=1,
        theta_resolution=np.pi/64
    )
    INTER_LINE_WIDTH = 15