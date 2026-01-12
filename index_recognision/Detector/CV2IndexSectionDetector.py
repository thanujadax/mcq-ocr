import cv2
import numpy as np

##################### Helper Functions #####################

def get_all_child_contour_indices(hierarchy, parent_index) -> list[int]:
    child_indices = []
    first_child_index = hierarchy[0][parent_index][2]
    if first_child_index == -1:
        return child_indices
    child_indices.append(first_child_index)
    next_sibling_index = hierarchy[0][first_child_index][0]
    while next_sibling_index != -1:
        child_indices.append(next_sibling_index)
        next_sibling_index = hierarchy[0][next_sibling_index][0]
    return child_indices

def crop_to_bounding_box(image: np.ndarray, box: np.ndarray) -> np.ndarray:
    s = box.sum(axis=1)
    diff = np.diff(box, axis=1)

    ordered = np.zeros((4, 2), dtype="float32")
    ordered[0] = box[np.argmin(s)]   # top-left (smallest sum)
    ordered[2] = box[np.argmax(s)]   # bottom-right (largest sum)
    ordered[1] = box[np.argmin(diff)] # top-right (smallest diff)
    ordered[3] = box[np.argmax(diff)] # bottom-left (largest diff)

    # Compute new width and height
    (tl, tr, br, bl) = ordered
    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    maxWidth = int(max(widthA, widthB))
    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxHeight = int(max(heightA, heightB))

    # Destination rectangle
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ], dtype="float32")
    # Perspective transform
    M = cv2.getPerspectiveTransform(ordered, dst)

    # Warp the image
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    return warped


##################### Main Class #####################
class CV2IndexSectionDetector:
    def __init__(self,image: np.ndarray = None, operating_width: int = 1000, operating_height: int = 1500,
                 blur_spread: int = 5, blur_strength: int = 2, min_contour_area: int = 10000, max_contour_area: int = 50000):
        self.operating_width = operating_width
        self.operating_height = operating_height
        self.blur_spread = blur_spread if blur_spread % 2 == 1 else blur_spread + 1
        self.blur_strength = blur_strength
        self.min_contour_area = min_contour_area
        self.max_contour_area = max_contour_area
        if image:
            image = cv2.resize(image, (self.operating_width, self.operating_height))
        self.original = image
        self.current = image
        self.contours = []
        self.hierarchy = []
        self.best_contour = None
    
    def __contour_validate_min_bound__(self, contour: np.ndarray) -> bool:
        area = cv2.contourArea(contour)
        return area >= self.min_contour_area
    
    def __contour_validate_max_bound__(self, contour: np.ndarray) -> bool:
        area = cv2.contourArea(contour)
        return area <= self.max_contour_area
    
    def __get_largest_contour_index__(self,indices) -> int:
        largets_index = -1
        largest_area = -1
        for idx in indices:
            area = cv2.contourArea(self.contours[idx])
            if area > largest_area:
                largest_area = area
                largets_index = idx
        return largets_index
    
    def set_image(self, image: np.ndarray):
        image = cv2.resize(image, (self.operating_width, self.operating_height))
        self.original = image
        self.current = image
    
    def reset(self):
        self.current = self.original
    
    def get_current(self) -> np.ndarray:
        return self.current
    
    def get_original(self) -> np.ndarray:
        return self.original
    
    def get_contours(self) -> list[np.ndarray]:
        return self.contours
    
    def get_hierarchy(self) -> np.ndarray:
        return self.hierarchy
    
    def preprocess(self):
        gray = cv2.cvtColor(self.current, cv2.COLOR_BGR2GRAY)
        filtered_image = cv2.GaussianBlur(gray, (self.blur_spread, self.blur_spread), self.blur_strength)
        self.current = cv2.Canny(filtered_image,10,50)

    def detect_contours(self):
        contours, hierarchy = cv2.findContours(self.current, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        self.contours = contours
        self.hierarchy = hierarchy
    
    def filter_contours(self):
        # Step 1: Find the largest outer contour
        contour_indices_list = list(range(len(self.contours)))
        largest_contour_outer_idx = self.__get_largest_contour_index__(contour_indices_list)
        candidate_contour = self.contours[largest_contour_outer_idx]
        if not (self.__contour_validate_min_bound__(candidate_contour)):
            raise ValueError("No contour meets the minimum area requirement.")
        self.best_contour = candidate_contour

        # Step 2: Find its largest child contour
        direct_children_outer = get_all_child_contour_indices(self.hierarchy, largest_contour_outer_idx)
        if not direct_children_outer:
            raise ValueError("No child contours found within the largest contour.")
        largest_contour_inner_idx = self.__get_largest_contour_index__(direct_children_outer)
        candidate_contour = self.contours[largest_contour_inner_idx]
        if not (self.__contour_validate_min_bound__(candidate_contour)):
            raise ValueError("No inner contour meets the minimum area requirement.")
        self.best_contour = candidate_contour

        # Step 3: Find its largest child contour
        child_indices = get_all_child_contour_indices(self.hierarchy, largest_contour_inner_idx)
        if not child_indices:
            raise ValueError("No child contours found within the largest inner contour.")
        largest_contour_inner_most_idx = self.__get_largest_contour_index__(child_indices)
        candidate_contour = self.contours[largest_contour_inner_most_idx]
        if not (self.__contour_validate_min_bound__(candidate_contour) and self.__contour_validate_max_bound__(candidate_contour)):
            raise ValueError("No innermost contour meets the area requirements.")
        self.best_contour = candidate_contour

    
    def extract_index_section(self) -> np.ndarray:
        target_contour = self.best_contour
        if self.__contour_validate_max_bound__(target_contour) is False:
            raise ValueError("The best contour exceeds the maximum area limit.")
        rect = cv2.minAreaRect(target_contour)
        box = np.array(cv2.boxPoints(rect), dtype="float32")
        cropped_image = crop_to_bounding_box(self.original, box)
        return cropped_image
        