import numpy as np
from .LineBasedIndexSectionDetector import LineBasedIndexSectionDetector
from .config import Config

detector = LineBasedIndexSectionDetector(operating_width=Config.OPERATING_WIDTH,
                                            operating_height=Config.OPERATING_HEIGHT,
                                            output_width=Config.OUTPUT_WIDTH,
                                            output_height=Config.OUTPUT_HEIGHT,
                                            edge_detection_params_1=Config.EDGE_DETECTION_PARAMS_1,
                                            morph_kernel_size=Config.MORPH_KERNEL_SIZE,
                                            edge_detection_params_2=Config.EDGE_DETECTION_PARAMS_2,
                                            min_contour_area=Config.MIN_CONTOUR_AREA,
                                            max_contour_area=Config.MAX_CONTOUR_AREA,
                                            contour_margin=Config.CONTOUR_MARGIN,
                                            vertical_line_detection_params=Config.VERTICAL_LINE_DETECTION_PARAMS,
                                            horizontal_line_detection_params=Config.HORIZONTAL_LINE_DETECTION_PARAMS,
                                            inter_line_width=Config.INTER_LINE_WIDTH)

def get_index_section(image: np.ndarray) -> np.ndarray:
    """
    Extracts the section of the input image that contains the student index number.

    Args:
        image: Input image.

    Returns:
        Cropped image containing the student index section.
    """
    detector.set_image(image)
    try:
        image = detector.extract_index_section(debug=False)
    except Exception as e:
        print(f"Error during index section extraction: {e}")
        image = detector.get_current()
    return image