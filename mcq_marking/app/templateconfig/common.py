import cv2
import numpy as np
from app.templateconfig.utils import get_canny_edges,detect_rectangles,categorize

def warp_image_to_rectangles(img, categorized_rectangles, target_width=1200, target_height=1600):
    """
    Warp the image to align with detected rectangles for standardization.
    Returns a warped version of the image.
    """
    if not categorized_rectangles:
        return img
    
    # Define target corners (perfect rectangle)
    target_corners = np.float32([
        [0, 0],                    # top-left
        [target_width, 0],         # top-right
        [target_width, target_height], # bottom-right
        [0, target_height]         # bottom-left
    ])
    
    # Convert source corners to numpy array
    source_corners = np.float32([
        categorized_rectangles["top_left"][3][0],
        categorized_rectangles["top_right"][3][1],
        categorized_rectangles["bottom_right"][3][2],
        categorized_rectangles["bottom_left"][3][3]
    ])
    
    # Calculate perspective transform matrix
    transform_matrix = cv2.getPerspectiveTransform(source_corners, target_corners)
    
    # Apply perspective transform
    warped = cv2.warpPerspective(img, transform_matrix, (target_width, target_height))
    
    return warped


def prepare_image(img):
    img, edges = get_canny_edges(img)

    # Find contours
    external_contours, external_hierarchy = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    # contours, hierarchy = cv2.findContours(edges, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    # internal_contours = [contours[i] for i in range(len(contours)) if hierarchy[0][i][3] == -1]
    # contours = internal_contours

    # Create a copy of the original image to draw on
    contours_marked_img = img.copy()

    # Detect rectangles and circles
    rectangles = detect_rectangles(external_contours)

    if len(rectangles) < 4:
        raise ValueError("Less than 4 rectangles found in the image. Cannot proceed.")

    categorized_rectangles = categorize(rectangles)
    
    # Warp image to predefined size using detected corners
    warped_img = warp_image_to_rectangles(img, categorized_rectangles)    

    # Draw rectangles
    for i, (key, value) in enumerate(categorized_rectangles.items()):
        color = (0, 0, 255)
        if len(value) >= 4:
            corners = value[3]
            for j in range(len(corners)):
                pt1 = corners[j]
                pt2 = corners[(j + 1) % len(corners)]  # Connect to next corner (wraps around)
                cv2.line(contours_marked_img, pt1, pt2, color, 2)
        else:
            x, y, w, h = value[2]
            corners = [
                (x, y),           # top-left
                (x + w, y),       # top-right
                (x + w, y + h),   # bottom-right
                (x, y + h)        # bottom-left
            ]
            for j in range(4):
                pt1 = corners[j]
                pt2 = corners[(j + 1) % 4]
                cv2.line(contours_marked_img, pt1, pt2, color, 2)
        cv2.putText(contours_marked_img, key, (value[2][0], value[2][1] + value[2][3] + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    return contours_marked_img, warped_img