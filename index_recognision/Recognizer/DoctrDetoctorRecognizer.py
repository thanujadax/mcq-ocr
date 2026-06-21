from doctr.models import recognition_predictor, detection_predictor
import numpy as np
import cv2
import os

def get_detected_image(original_image: np.ndarray, boxes: list, margin_x:int, margin_y:int) -> np.ndarray:
    """
    Extracts the region of interest from the original image based on the provided bounding boxes.

    Args:
        original_image: The original image as a NumPy array.
        boxes: A list of bounding boxes, where each box is represented as [x_min, y_min, x_max, y_max, score].

    Returns:
        The cropped image containing the detected region.
    """
    h, w = original_image.shape[:2]

    # Filter out boxes that are too small
    boxes = [box for box in boxes if (int(box[2] * w) - int(box[0] * w)) * (int(box[3] * h) - int(box[1] * h)) >= 100]
    if not len(boxes) > 0:
        raise ValueError("No valid boxes detected.")

    top_left_x = min(int(box[0] * w) for box in boxes)
    top_left_y = min(int(box[1] * h) for box in boxes)
    bottom_right_x = max(int(box[2] * w) for box in boxes)
    bottom_right_y = max(int(box[3] * h) for box in boxes)

    # Ensure coordinates are within image bounds
    top_left_x = max(top_left_x-margin_x, 0)
    top_left_y = max(top_left_y-margin_y, 0)
    bottom_right_x = min(bottom_right_x+margin_x, w)
    bottom_right_y = min(bottom_right_y+margin_y, h)

    cropped_img = original_image[top_left_y:bottom_right_y, top_left_x:bottom_right_x]
    return cropped_img

class DoctrDetoctorRecognizer:
    def __init__(self, intermediate_results_dir:str="./intermediate", det_model_name: str = "fast_base",rec_model_name: str = "crnn_vgg16_bn",
                 detect_margin_x:int = 5,
                 detect_margin_y:int = 5):
        # Initialize the Doctr detection model
        self.det_model = detection_predictor(det_model_name, pretrained=True)
        # Initialize the Doctr recognition model
        self.rec_model = recognition_predictor(rec_model_name,pretrained=True)
        self.intermediate_results_dir = intermediate_results_dir
        self.detect_margin_x = detect_margin_x
        self.detect_margin_y = detect_margin_y

    def __save_intermediate(self, image: np.ndarray, step_name: str, file_id: str):
        if not os.path.exists(self.intermediate_results_dir):
            os.makedirs(self.intermediate_results_dir)
        cv2.imwrite(os.path.join(self.intermediate_results_dir, f"{file_id}_{step_name}.png"), image)


    def recognize_student_index(self, index_image: np.ndarray, debug:bool=False, file_id:str="temp") -> dict:
        # Perform detection using the Doctr detection model
        det_result = self.det_model([index_image])
        try:
            detected_image = get_detected_image(index_image, det_result[0]['words'],self.detect_margin_x,self.detect_margin_y)
        except Exception as e:
            print(f"Error bounding box during detection: {e}")
            detected_image = index_image
        if debug:
            self.__save_intermediate(detected_image, "detected", file_id)
        # Perform recognition using the Doctr recognition model
        result = self.rec_model([detected_image])
        # Extract the recognized text and confidence score
        pred_index = result[0][0]
        confidence = result[0][1]
        return {
            "index_number": pred_index,
            "confidence": confidence
        }
    