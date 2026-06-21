import cv2
import numpy as np
from auto_config.utils import categorize, detect_circles, detect_rectangles, get_canny_edges, get_first_row_and_column

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
    result_img = img.copy()

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
                cv2.line(result_img, pt1, pt2, color, 2)
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
                cv2.line(result_img, pt1, pt2, color, 2)
        cv2.putText(result_img, key, (value[2][0], value[2][1] + value[2][3] + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    return result_img, warped_img


def get_config(img_path, show_intermediate_results=False):
    img = cv2.imread(img_path)

    # # Tilt the image by applying a small shear transformation
    (h, w) = img.shape[:2]
    shear_factor = 0.1  # Adjust this value for more/less tilt
    M = np.array([[1, shear_factor, 0],
                  [0, 1, 0]], dtype=np.float32)
    nW = int(w + abs(shear_factor * h))
    img = cv2.warpAffine(img, M, (nW, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


    img_with_rectangles, warped_img = prepare_image(img)
    img, edges = get_canny_edges(warped_img)
    external_contours, external_hierarchy = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    circles = detect_circles(external_contours)

    result_img = img.copy()

    # Draw circles
    for i, (contour, area, center, radius) in enumerate(circles):
        color = (0, 255, 0)
        cv2.circle(result_img, center, radius, color, 2)

    # Draw the first bubble
    first_bubble = min(circles, key=lambda c: c[2][1] + c[2][0]) if circles else None
    if first_bubble is not None:
        center = first_bubble[2]
        cv2.circle(result_img, center, 3, (255, 0, 0), -1)

    first_row, first_column = get_first_row_and_column(circles, first_bubble)

    x_offset = (first_row[4][2][0] - first_row[0][2][0])/4
    y_offset = (first_column[-1][2][1] - first_column[0][2][1])/(len(first_column)-1)

    # get the column starting points
    column_starting_points = [first_bubble]
    for i in range(1,len(first_row)):
        if first_row[i][2][0] - first_row[i-1][2][0] > 1.6*x_offset:
            column_starting_points.append(first_row[i])
            cv2.circle(result_img, first_row[i][2], 3, (0, 0, 255), -1)

    # bubble coordinate json
    bubble_coordinates = {
            "starting_x" : first_bubble[2][0],
            "starting_y" : first_bubble[2][1],
            "x_offset" : x_offset,
            "y_offset" : y_offset,
            "x_column_offset" : column_starting_points[1][2][0] - column_starting_points[0][2][0],
            "x_adjustment" : 0,
            "columns": {
                str(i+1): {
                    "starting_y": pt[2][1]
                } for i, pt in enumerate(column_starting_points)
            }
        }


    # Display both original and result
    # Convert edges to BGR for stacking
    edges_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

    # Stack the images horizontally for comparison
    stacked = cv2.hconcat([img_with_rectangles, result_img])
    if show_intermediate_results:
        cv2.imshow("Original | Rectangles & Circles Detected | Edges", stacked)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    return warped_img, bubble_coordinates

# print(get_config("/Users/vihangamunasinghe/WebProjects/DSE Project/mcq-ocr/samples/templates/1.jpg", show_intermediate_results=True))
print(get_config("/Users/vihangamunasinghe/WebProjects/DSE Project/mcq-ocr/2023_sample/templates/1.jpg", show_intermediate_results=True))
