import cv2
import numpy as np
from app.templateconfig.utils import categorize, detect_circles, detect_rectangles, get_canny_edges, get_row_and_column
from app.storage.nfs_storage import NFSStorage
from app.templateconfig.common import prepare_image




def get_config(img_path, want_intermediate_results=False):
    """
    Get template configuration from image
    
    Args:
        img_path: Relative path to image in NFS storage
        want_intermediate_results: Whether to return intermediate processing results
    
    Returns:
        tuple: (bubble_configs, warped_img, result_img)
    """
    # Load image from NFS storage
    nfs = NFSStorage()
    img_bytes = nfs.get_file(img_path)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # # # Tilt the image by applying a small shear transformation
    # (h, w) = img.shape[:2]
    # shear_factor = 0.1  # Adjust this value for more/less tilt
    # M = np.array([[1, shear_factor, 0],
    #               [0, 1, 0]], dtype=np.float32)
    # nW = int(w + abs(shear_factor * h))
    # img = cv2.warpAffine(img, M, (nW, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


    img_with_rectangles, warped_img = prepare_image(img)
    img, edges = get_canny_edges(warped_img)
    external_contours, external_hierarchy = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    circles = detect_circles(external_contours)

    result_img = None

    first_bubble = min(circles, key=lambda c: c[2][1] + c[2][0]) if circles else None

    if want_intermediate_results:
        result_img = img.copy()
        # Draw circles
        for i, (contour, area, center, radius) in enumerate(circles):
            color = (0, 255, 0)
            cv2.circle(result_img, center, radius, color, 2)

        # Draw the first bubble
        if first_bubble is not None:
            center = first_bubble[2]
            cv2.circle(result_img, center, 6, (255, 0, 0), -1)

    first_row, first_column = get_row_and_column(circles, first_bubble, column_only=False)

    x_offset = (first_row[4][2][0] - first_row[0][2][0])/4
    y_offset = (first_column[-1][2][1] - first_column[0][2][1])/(len(first_column)-1)

    # get the column starting points
    column_starting_points = [first_bubble]
    column_row_distribution = [len(first_column)]
    for i in range(1,len(first_row)):
        if first_row[i][2][0] - first_row[i-1][2][0] > 1.6*x_offset:
            column_starting_points.append(first_row[i])
            cv2.circle(result_img, first_row[i][2], 6, (0, 0, 255), -1)
            column = get_row_and_column(circles, first_row[i], column_only=True)
            column_row_distribution.append(len(column))


    # bubble coordinate json
    bubble_configs = {
        "metadata": {
            "num_questions": sum(column_row_distribution),
            "column_row_distribution": column_row_distribution,
            "options_per_question": int(len(first_row)/len(column_row_distribution))
        },
        "bubble_configs": {
            "x_offset": float(x_offset),
            "y_offset": float(y_offset),
            "columns": {
                str(i + 1): {
                    "starting_x": int(pt[2][0]),
                    "starting_y": int(pt[2][1])
                }
                for i, pt in enumerate(column_starting_points)
            }
        }
    }
    return bubble_configs, warped_img, result_img
