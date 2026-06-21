import cv2
import numpy as np
from PIL import Image



class AnomalyDetector:
    """
    A class for detecting anomalies in marked answer sheets by comparing them to a template.
    """

    def __init__(
        self,
        template_image,  # Changed from template_path to template_image
        threashold=1700,
        resize_dimensions=(1200, 1600),
        bilateral_d=5,
        bilateral_sigma_color=50,
        bilateral_sigma_space=50,
        clahe_clip_limit=2.0,
        clahe_tile_size=(8, 8),
        unsharp_alpha=1.5,
        unsharp_beta=-0.5,
        erosion_kernel_size=(2, 2),
        erosion_iterations=1,
        orb_features=5000,
        lowe_ratio=0.75,
        max_matches=500,
        ransac_threshold=5.0,
        canny_threshold1=100,
        canny_threshold2=200,
        circle_area_threshold=10,
        circle_circularity_threshold=0.7,
        diff_threshold=50,
        morph_kernel_size=(3, 3),
        circle_padding=5
    ):
        """
        Initialize the AnswerSheetChecker with a template image.

        Parameters:
        -----------
        template_image : PIL.Image or str
            Template answer sheet image (PIL Image object or path to image file)
        threashold : int
            Threshold for binary mask
        resize_dimensions : tuple
            Target dimensions (width, height) for resizing images
        bilateral_d : int
            Diameter of pixel neighborhood for bilateral filter
        bilateral_sigma_color : int
            Filter sigma in the color space for bilateral filter
        bilateral_sigma_space : int
            Filter sigma in the coordinate space for bilateral filter
        clahe_clip_limit : float
            Threshold for contrast limiting in CLAHE
        clahe_tile_size : tuple
            Size of grid for histogram equalization
        unsharp_alpha : float
            Weight for original image in unsharp masking
        unsharp_beta : float
            Weight for blurred image in unsharp masking
        erosion_kernel_size : tuple
            Size of kernel for erosion operation
        erosion_iterations : int
            Number of erosion iterations
        orb_features : int
            Maximum number of ORB features to detect
        lowe_ratio : float
            Ratio test threshold for feature matching (0-1)
        max_matches : int
            Maximum number of matches to use for homography
        ransac_threshold : float
            Maximum allowed reprojection error in RANSAC
        canny_threshold1 : int
            First threshold for Canny edge detection
        canny_threshold2 : int
            Second threshold for Canny edge detection
        circle_area_threshold : int
            Minimum area for circle detection
        circle_circularity_threshold : float
            Minimum circularity for circle detection (0-1)
        diff_threshold : int
            Threshold for difference detection
        morph_kernel_size : tuple
            Kernel size for morphological operations
        circle_padding : int
            Additional padding around detected circles for removal
        """
        self.threashold = threashold
        self.resize_dimensions = resize_dimensions
        self.bilateral_d = bilateral_d
        self.bilateral_sigma_color = bilateral_sigma_color
        self.bilateral_sigma_space = bilateral_sigma_space
        self.clahe_clip_limit = clahe_clip_limit
        self.clahe_tile_size = clahe_tile_size
        self.unsharp_alpha = unsharp_alpha
        self.unsharp_beta = unsharp_beta
        self.erosion_kernel_size = erosion_kernel_size
        self.erosion_iterations = erosion_iterations
        self.orb_features = orb_features
        self.lowe_ratio = lowe_ratio
        self.max_matches = max_matches
        self.ransac_threshold = ransac_threshold
        self.canny_threshold1 = canny_threshold1
        self.canny_threshold2 = canny_threshold2
        self.circle_area_threshold = circle_area_threshold
        self.circle_circularity_threshold = circle_circularity_threshold
        self.diff_threshold = diff_threshold
        self.morph_kernel_size = morph_kernel_size
        self.circle_padding = circle_padding

        # Load and preprocess template
        self.template = self._load_image(template_image)
        if self.template is None:
            raise ValueError(f"Could not load template image")

        # Resize template
        self.template = cv2.resize(self.template, self.resize_dimensions)

        # Initialize ORB detector for template
        self.orb = cv2.ORB_create(self.orb_features)
        self.template_kp, self.template_des = self.orb.detectAndCompute(self.template, None)

        # Initialize matcher
        self.bf = cv2.BFMatcher(cv2.NORM_HAMMING)

    def _load_image(self, image_input):
        """
        Load image from PIL Image object or file path.
        
        Parameters:
        -----------
        image_input : PIL.Image or str
            PIL Image object or path to image file
            
        Returns:
        --------
        numpy.ndarray
            Grayscale OpenCV image
        """
        try:
            if isinstance(image_input, Image.Image):
                # Convert PIL image to OpenCV format
                if image_input.mode != 'L':
                    image_input = image_input.convert('L')
                return np.array(image_input)
            else:
                # Assume it's a file path
                return cv2.imread(image_input, 0)
        except ImportError:
            # PIL not available, assume it's a file path
            return cv2.imread(image_input, 0)

    def _preprocess_image(self, image):
        """Apply preprocessing steps to enhance image quality."""
        # Bilateral filter (preserves edges)
        processed = cv2.bilateralFilter(
            image,
            d=self.bilateral_d,
            sigmaColor=self.bilateral_sigma_color,
            sigmaSpace=self.bilateral_sigma_space
        )

        # Gentle CLAHE
        clahe = cv2.createCLAHE(
            clipLimit=self.clahe_clip_limit,
            tileGridSize=self.clahe_tile_size
        )
        processed = clahe.apply(processed)

        # Unsharp mask
        blurred = cv2.GaussianBlur(processed, (3, 3), 1)
        processed = cv2.addWeighted(
            processed,
            self.unsharp_alpha,
            blurred,
            self.unsharp_beta,
            0
        )

        # Optional mild erosion to tighten outlines
        kernel = np.ones(self.erosion_kernel_size, np.uint8)
        processed = cv2.erode(processed, kernel, iterations=self.erosion_iterations)

        return processed

    def _align_images(self, marked):
        """Align template to marked image using feature matching."""
        # Detect and compute features for marked image
        marked_kp, marked_des = self.orb.detectAndCompute(marked, None)

        # Match features using KNN
        matches = self.bf.knnMatch(self.template_des, marked_des, k=2)

        # Apply Lowe's ratio test
        good_matches = []
        for match_pair in matches:
            if len(match_pair) == 2:
                m, n = match_pair
                if m.distance < self.lowe_ratio * n.distance:
                    good_matches.append(m)

        # Limit matches for homography computation
        good_matches = sorted(good_matches, key=lambda x: x.distance)[:self.max_matches]

        # Extract matching points
        src_pts = np.float32([self.template_kp[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([marked_kp[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

        # Compute Homography
        H, _ = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, self.ransac_threshold)

        # Warp template to align with marked image
        aligned = cv2.warpPerspective(
            self.template,
            H,
            (marked.shape[1], marked.shape[0]),
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=255
        )

        return aligned

    def _detect_circles_and_index(self, aligned, marked):
        """Detect circles and index rectangle from aligned template."""
        # Apply Canny edge detection
        edges = cv2.Canny(aligned, self.canny_threshold1, self.canny_threshold2)

        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detected_circles = []
        index_rectangle = None
        max_area = 0

        # Iterate through contours
        for contour in contours:
            area = cv2.contourArea(contour)
            perimeter = cv2.arcLength(contour, True)

            # Avoid division by zero
            if perimeter > 0:
                # Calculate circularity
                circularity = 4 * np.pi * area / (perimeter ** 2)

                if area > self.circle_area_threshold and circularity > self.circle_circularity_threshold:
                    (x, y, w, h) = cv2.boundingRect(contour)
                    detected_circles.append((x, y, w, h))

            # Track largest contour for index rectangle
            if area > max_area:
                max_area = area
                index_rectangle = cv2.boundingRect(contour)

        return detected_circles, index_rectangle

    def check(self, marked_image):
        """
        Check a marked answer sheet against the template.

        Parameters:
        -----------
        marked_image : PIL.Image or str
            Marked answer sheet image (PIL Image object or path to image file)

        Returns:
        --------
        tuple
            (anomaly_detected: bool, non_zero_count: int)
        """
        # Load marked image
        marked = self._load_image(marked_image)
        if marked is None:
            raise ValueError(f"Could not load marked image")

        # Resize marked image
        marked = cv2.resize(marked, self.resize_dimensions)

        # Preprocess marked image
        marked = self._preprocess_image(marked)

        # Align template to marked image
        aligned = self._align_images(marked)

        # Detect circles and index rectangle
        detected_circles, index_rectangle = self._detect_circles_and_index(aligned, marked)

        # Compute difference between marked and aligned template
        diff = cv2.absdiff(marked, aligned)

        # Threshold to highlight changes
        _, mask = cv2.threshold(diff, self.diff_threshold, 255, cv2.THRESH_BINARY)

        # Clean up small noise
        mask = cv2.morphologyEx(
            mask,
            cv2.MORPH_OPEN,
            np.ones(self.morph_kernel_size, np.uint8)
        )

        # Create removal mask for circles and index
        removing_mask = np.zeros_like(mask)

        # Add detected circles to removal mask
        for (x, y, w, h) in detected_circles:
            center_x = int(x + w/2)
            center_y = int(y + h/2)
            radius = int(max(w, h)/2)
            cv2.circle(removing_mask, (center_x, center_y), radius + self.circle_padding, 255, -1)

        # Add index rectangle to removal mask
        if index_rectangle is not None:
            cv2.rectangle(
                removing_mask,
                (index_rectangle[0], index_rectangle[1]),
                (index_rectangle[0] + index_rectangle[2], index_rectangle[1] + index_rectangle[3]),
                255,
                -1
            )

        # Invert removal mask and apply to clean mask
        circle_mask_inv = cv2.bitwise_not(removing_mask)
        cleaned_mask = cv2.bitwise_and(mask, mask, mask=circle_mask_inv)
        
        non_zeros = np.count_nonzero(cleaned_mask)
        return ( non_zeros > self.threashold, non_zeros)