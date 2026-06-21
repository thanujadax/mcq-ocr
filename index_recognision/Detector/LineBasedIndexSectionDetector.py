import cv2
import numpy as np
import os
import math
from dataclasses import dataclass

@dataclass
class BlurCannyConfig:
    blur_spread: int
    blur_strength: int
    canny_threshold1: float
    canny_threshold2: float

@dataclass
class HoughLineConfig:
    threshold: int
    angle_tolerance: float
    rho_resolution: float
    theta_resolution: float

# default config
edge_detection_params_1 = BlurCannyConfig(
    blur_spread=5,
    blur_strength=2,
    canny_threshold1=30,
    canny_threshold2=200
)

edge_detection_params_2 = BlurCannyConfig(
    blur_spread=9,
    blur_strength=2,
    canny_threshold1=30,
    canny_threshold2=200
)

vertical_line_detection_params = HoughLineConfig(
    threshold=30,
    angle_tolerance=np.pi/64,
    rho_resolution=1,
    theta_resolution=np.pi/180
)

horizontal_line_detection_params = HoughLineConfig(
    threshold=100,
    angle_tolerance=np.pi/16,
    rho_resolution=1,
    theta_resolution=np.pi/180
)

##################### Helper Functions #####################
def contour_area_filter(contours, min_area, max_area):
    filtered_contours = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if min_area <= area <= max_area:
            filtered_contours.append(contour)
    return filtered_contours

def detect_hough_lines(image, threshold:int, horisontal:bool = False, angle_tolerance:float=np.pi/16, rho_resolution:float=1, theta_resolution:float=np.pi/180):
    main_angle = np.pi/2 if horisontal else 0
    min_angle  = main_angle-angle_tolerance
    max_angle  = main_angle+angle_tolerance
    lines = cv2.HoughLinesWithAccumulator(image, rho_resolution, theta_resolution,threshold, None, 0,0, min_angle, max_angle)
    return lines

def get_points_on_line(line):
    rho, theta, _ = line[0]
    a = math.cos(theta)
    b = math.sin(theta)
    x0 = a * rho
    y0 = b * rho
    pt1 = (int(x0 + 1000 * (-b)), int(y0 + 1000 * (a)))
    pt2 = (int(x0 - 1000 * (-b)), int(y0 - 1000 * (a)))
    return pt1,pt2

def group_lines(lines, inter_line_width:int=15):
    line_groups = []
    sorted_lines = sorted(lines, key=lambda x: x[0][0])
    line_groups.append([sorted_lines[0]])
    current_group_index = 0
    current_rho = sorted_lines[0][0][0]
    for line in sorted_lines[1:]:
        rho = line[0][0]
        if rho - current_rho <= inter_line_width:
            line_groups[current_group_index].append(line)
        else:
            line_groups.append([line])
            current_group_index += 1
        current_rho = rho
    return line_groups

def solve_line_intersection(line1, line2):
    rho1, theta1, _ = line1[0]
    rho2, theta2, _ = line2[0]
    A = np.array([[np.cos(theta1), np.sin(theta1)],
                  [np.cos(theta2), np.sin(theta2)]])
    b = np.array([[rho1],
                  [rho2]])
    if np.linalg.det(A) == 0:
        return None
    x0, y0 = np.linalg.solve(A, b)
    x0, y0 = int(np.round(x0.item())), int(np.round(y0.item()))
    return (x0, y0)

##################### Main Class #####################
class LineBasedIndexSectionDetector:
    def __init__(self, intermediate_results_dir:str="./intermediate", operating_width: int = 1000, operating_height: int = 1500,
                 output_width: int = 300, output_height: int = 60,
                 edge_detection_params_1: BlurCannyConfig = edge_detection_params_1, edge_detection_params_2: BlurCannyConfig = edge_detection_params_2,
                 morph_kernel_size: int = 3,
                 min_contour_area: int = 10000, max_contour_area: int = 50000, contour_margin: int = 10,
                 vertical_line_detection_params: HoughLineConfig = vertical_line_detection_params,
                 horizontal_line_detection_params: HoughLineConfig = horizontal_line_detection_params,
                 inter_line_width: int = 15):
        self.operating_width = operating_width
        self.operating_height = operating_height
        self.output_width = output_width
        self.output_height = output_height
        self.edge_detection_params_1 = edge_detection_params_1
        self.edge_detection_params_2 = edge_detection_params_2
        self.min_contour_area = min_contour_area
        self.max_contour_area = max_contour_area
        self.intermediate_results_dir = intermediate_results_dir
        self.contour_margin = contour_margin
        self.vertical_line_detection_params = vertical_line_detection_params
        self.horizontal_line_detection_params = horizontal_line_detection_params
        self.inter_line_width = inter_line_width
        self.morph_kernel_size = morph_kernel_size

    def __save_intermediate(self, image: np.ndarray, step_name: str, file_id: str):
        if not os.path.exists(self.intermediate_results_dir):
            os.makedirs(self.intermediate_results_dir)
        cv2.imwrite(os.path.join(self.intermediate_results_dir, f"{file_id}_{step_name}.png"), image)

    def set_image(self, image: np.ndarray):
        image = cv2.resize(image, (self.operating_width, self.operating_height))
        self.original = image
        self.current = image
    
    def reset(self):
        self.current = self.original
    
    def get_current(self) -> np.ndarray:
        return self.current
    
    def extract_index_section(self, debug:bool = False,file_id:str="file") -> np.ndarray:
        ########################## PHASE 1 ##########################
        ############ STEP 1: Edge Detection ############
        blur_spread = self.edge_detection_params_1.blur_spread
        blur_strength = self.edge_detection_params_1.blur_strength
        canny_threshold1 = self.edge_detection_params_1.canny_threshold1
        canny_threshold2 = self.edge_detection_params_1.canny_threshold2
        morph_kernel_size = self.morph_kernel_size
        # Convert to grayscale
        gray_paper = cv2.cvtColor(self.current, cv2.COLOR_BGR2GRAY)
        # Blur the image to reduce noise
        blurred_paper = cv2.GaussianBlur(gray_paper, (blur_spread, blur_spread), blur_strength)
        # Edge detection using Canny
        edge_detected_paper = cv2.Canny(blurred_paper, canny_threshold1, canny_threshold2)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (morph_kernel_size, morph_kernel_size))
        morphed_paper = cv2.morphologyEx(edge_detected_paper, cv2.MORPH_CLOSE, kernel)
        if debug:
            self.__save_intermediate(morphed_paper, "step1_edge_detected", file_id)
        ############ STEP 2: Contour Detection and Filtering ############
        # Find contours
        contours,_ = cv2.findContours(morphed_paper,cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE)
        # contour count validation
        if len(contours) == 0:
            raise ValueError("No contours found in the image.")
        # Filter contours by area
        filtered_contours = contour_area_filter(contours, self.min_contour_area, self.max_contour_area)
        # filtered contour count validation
        if len(filtered_contours) == 0:
            raise ValueError("No contours found after filtering by area.")
        if debug:
            contour_visualization = self.current.copy()
            cv2.drawContours(contour_visualization, filtered_contours, -1, (0,255,0), 3)
            self.__save_intermediate(contour_visualization, "step2_filtered_contours", file_id)
        ############ STEP 3: Target Contour Selection and Extraction ############
        # choose the max area contour as target
        target = max(filtered_contours, key=cv2.contourArea)
        box = cv2.boundingRect(target)
        x, y, w, h = box
        x -= self.contour_margin
        y -= self.contour_margin
        w += 2 * self.contour_margin
        h += 2 * self.contour_margin
        # Clamp coordinates to image boundaries
        height, width = self.current.shape[:2]
        x = max(0, x)
        y = max(0, y)
        x2 = min(width, x + w)
        y2 = min(height, y + h)
        self.current = self.current[y:y2, x:x2].copy()
        if debug:
            self.__save_intermediate(self.current, "step3_extracted_section", file_id)
        ################################ PHASE 2 ##########################
        ############ STEP 4: Redetect Edges ############
        blur_spread = self.edge_detection_params_2.blur_spread
        blur_strength = self.edge_detection_params_2.blur_strength
        canny_threshold1 = self.edge_detection_params_2.canny_threshold1
        canny_threshold2 = self.edge_detection_params_2.canny_threshold2
        # Convert to grayscale
        gray_section = cv2.cvtColor(self.current, cv2.COLOR_BGR2GRAY)
        # Blur the image to reduce noise
        blurred_section = cv2.GaussianBlur(gray_section, (blur_spread, blur_spread), blur_strength)
        # Edge detection using Canny
        edge_detected_section = cv2.Canny(blurred_section, canny_threshold1, canny_threshold2)
        if debug:
            self.__save_intermediate(edge_detected_section, "step4_edge_detected_section", file_id)
        
        ############ STEP 5: Line Detection ##############################
        vertical_lines = detect_hough_lines(edge_detected_section,
                                   threshold=self.vertical_line_detection_params.threshold,
                                   horisontal=False,
                                   angle_tolerance=self.vertical_line_detection_params.angle_tolerance,
                                   rho_resolution=self.vertical_line_detection_params.rho_resolution,
                                   theta_resolution=self.vertical_line_detection_params.theta_resolution)
        horizontal_lines = detect_hough_lines(edge_detected_section,
                                     threshold=self.horizontal_line_detection_params.threshold,
                                     horisontal=True,
                                     angle_tolerance=self.horizontal_line_detection_params.angle_tolerance,
                                     rho_resolution=self.horizontal_line_detection_params.rho_resolution,
                                     theta_resolution=self.horizontal_line_detection_params.theta_resolution)
        if vertical_lines is None or horizontal_lines is None:
            raise ValueError("Insufficient lines detected for perspective correction.")
        if debug:
            line_visualization = self.current.copy()
            for line in vertical_lines:
                pt1,pt2 = get_points_on_line(line)
                cv2.line(line_visualization, pt1, pt2, (0,0,255), 2)
            for line in horizontal_lines:
                pt1,pt2 = get_points_on_line(line)
                cv2.line(line_visualization, pt1, pt2, (255,0,0), 2)
            self.__save_intermediate(line_visualization, "step5_detected_lines", file_id)
        # Group lines
        vertical_line_groups = group_lines(vertical_lines, self.inter_line_width)
        # vertical line group validation
        if len(vertical_line_groups) < 2:
            raise ValueError("Not enough vertical line groups detected for perspective correction.")
        horizontal_line_groups = group_lines(horizontal_lines, self.inter_line_width)
        # horizontal line group validation
        if len(horizontal_line_groups) < 2:
            raise ValueError("Not enough horizontal line groups detected for perspective correction.")
        
        if len(vertical_line_groups)==2:
            right_line_group = vertical_line_groups[1]
            left_line_group = vertical_line_groups[0]
        else:
            # We ignore the left most line(0)
            left_line_group = vertical_line_groups[1]
            right_line_group = vertical_line_groups[-1]
        # capture the top most and bottom most horizontal line groups
        top_line_group = horizontal_line_groups[0]
        bottom_line_group = horizontal_line_groups[-1]

        # Right: top 2 by votes, then pick leftmost (lowest rho)
        right_lines = sorted(right_line_group, key=lambda line: line[0][2], reverse=True)[:2]
        right_line = min(right_lines, key=lambda line: line[0][0])

        # Left: top 2 by votes, then pick rightmost (highest rho)
        left_lines = sorted(left_line_group, key=lambda line: line[0][2], reverse=True)[:2]
        left_line = max(left_lines, key=lambda line: line[0][0])

        
        # Top: top 2 by votes, then pick bottommost (highest rho → further down)
        top_lines = sorted(top_line_group, key=lambda line: line[0][2], reverse=True)[:2]
        top_line = max(top_lines, key=lambda line: line[0][0])

        
        # Bottom: top 2 by votes, then pick topmost (lowest rho → further up)
        bottom_lines = sorted(bottom_line_group, key=lambda line: line[0][2], reverse=True)[:2]
        bottom_line = min(bottom_lines, key=lambda line: line[0][0])


        ################## STEP 6: Warp Perspective ######################
        # Calculate intersection points
        top_left     = solve_line_intersection(left_line, top_line)
        top_right    = solve_line_intersection(right_line, top_line)
        bottom_left  = solve_line_intersection(left_line, bottom_line)
        bottom_right = solve_line_intersection(right_line, bottom_line)
        
        contour = np.array([top_left, top_right, bottom_right, bottom_left], dtype="float32")
        dst = np.array([
            [0, 0],
            [self.output_width - 1, 0],
            [self.output_width - 1, self.output_height - 1],
            [0, self.output_height - 1]], dtype="float32")
        M = cv2.getPerspectiveTransform(contour, dst)
        self.current = cv2.warpPerspective(self.current, M, (self.output_width, self.output_height))

        return self.current