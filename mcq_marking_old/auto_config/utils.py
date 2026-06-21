import cv2
import numpy as np

def get_canny_edges(img):
    fixed_width = 1200
    fixed_height = 1600
    img = cv2.resize(img, (fixed_width, fixed_height), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 1)
    edges = cv2.Canny(blur, 50, 150, apertureSize=3)
    return img,edges

def detect_rectangles(contours, min_area=400):
    """
    Detect rectangles from contours and return them sorted by area in descending order.
    
    Args:
        contours: List of contours from cv2.findContours()
        min_area: Minimum area to consider (default: 400)
    
    Returns:
        List of tuples: (contour, area, bounding_rect) sorted by area descending
    """
    rectangles = []
    
    for contour in contours:
        # Approximate the contour to a polygon
        epsilon = 0.02 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        
        # Check if it's a rectangle (4 corners)
        if len(approx) == 4:
            area = cv2.contourArea(contour)
            if area >= min_area:
                # Use cv2.approxPolyDP to get the actual 4 corner points of the rectangle
                epsilon = 0.02 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                if len(approx) == 4:
                    # Flatten the approx array and convert to tuple of points
                    rect_corners = sort_corners([tuple(pt[0]) for pt in approx])
                    x, y, w, h = cv2.boundingRect(contour)
                    rectangles.append((contour, area, (x, y, w, h), rect_corners))
    
    # Sort by area in descending order
    rectangles.sort(key=lambda x: x[1], reverse=True)
    return rectangles

def detect_circles(contours, min_area=200):
    """
    Detect circles from contours and return them sorted by area in descending order.
    
    Args:
        contours: List of contours from cv2.findContours()
        min_area: Minimum area to consider (default: 100)
    
    Returns:
        List of tuples: (contour, area, center, radius) sorted by area descending
    """
    circles = []
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if area >= min_area:
            # Calculate circularity
            perimeter = cv2.arcLength(contour, True)
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter * perimeter)
                
                # If circularity is close to 1, it's a circle
                if circularity > 0.85:  # Threshold for circle detection
                    # Find the minimum enclosing circle
                    (x, y), radius = cv2.minEnclosingCircle(contour)
                    circles.append((contour, area, (int(x), int(y)), int(radius)))
    
    # Sort by area in descending order
    circles.sort(key=lambda x: x[1], reverse=True)
    return circles

def sort_corners(corners):
    """Sort corners in order: top-left, top-right, bottom-right, bottom-left"""
    # Sort by y-coordinate first (top to bottom)
    top_corners = sorted(corners, key=lambda pt: pt[1])[:2]
    bottom_corners = sorted(corners, key=lambda pt: pt[1])[2:]
    
    # Sort top corners by x-coordinate (left to right)
    top_left = min(top_corners, key=lambda pt: pt[0])
    top_right = max(top_corners, key=lambda pt: pt[0])
    
    # Sort bottom corners by x-coordinate (left to right)
    bottom_left = min(bottom_corners, key=lambda pt: pt[0])
    bottom_right = max(bottom_corners, key=lambda pt: pt[0])
    
    return [top_left, top_right, bottom_right, bottom_left]

def get_first_row_and_column(circles, first_bubble):
    first_row = []
    first_column = []
    for i, (contour, area, center, radius) in enumerate(circles):
        # check if the circle is in the first row
        if center[1] <= first_bubble[2][1]+first_bubble[3] and center[1] >= first_bubble[2][1]-first_bubble[3]:
            first_row.append(circles[i])
            
        # check if the circle is in the first column    
        if center[0] <= first_bubble[2][0]+first_bubble[3] and center[0] >= first_bubble[2][0]-first_bubble[3]:
            first_column.append(circles[i])

    first_row.sort(key=lambda c: c[2][0])
    first_column.sort(key=lambda c: c[2][1])

    return first_row, first_column

def categorize(rectangles):
    rects = rectangles.copy()

    if (len(rects) > 4) :
        indexNumber = rects[0]
        rects.pop(0)
        top_right = max(rects, key=lambda c: c[2][0] - c[2][1])
    else:
        indexNumber = rects[0]
        indexNumber[3][1] = (indexNumber[3][0][0] + indexNumber[3][2][0] - indexNumber[3][3][0], indexNumber[3][0][1] + indexNumber[3][2][1] - indexNumber[3][3][1])
        top_left = min(rects, key=lambda c: c[2][0] + c[2][1])
        index_x, index_y, index_w, index_h = indexNumber[2]
        top_left_x, top_left_y, top_left_w, top_left_h = top_left[2]
        top_left_point = (index_x + index_w - top_left_w, index_y)
        rects.pop(0)
        # Construct the top_right rectangle tuple: (contour, area, (x, y, w, h))
        top_right_corners = ((top_left_point[0], top_left_point[1]), (top_left_point[0] + top_left_w, top_left_point[1]), (top_left_point[0] + top_left_w, top_left_point[1] + top_left_h), (top_left_point[0], top_left_point[1] + top_left_h))
        top_right = (None, top_left[1], (top_left_point[0], top_left_point[1], top_left_w, top_left_h), top_right_corners)
        

    # Corrected logic for finding rectangle corners
    top_left = min(rects, key=lambda c: c[2][0] + c[2][1])
    bottom_left = min(rects, key=lambda c: c[2][0] - c[2][1])
    bottom_right = max(rects, key=lambda c: c[2][0] + c[2][1])

    return {
        "indexNumber": indexNumber,
        "top_left": top_left,
        "top_right": top_right,
        "bottom_left": bottom_left,
        "bottom_right": bottom_right
    }