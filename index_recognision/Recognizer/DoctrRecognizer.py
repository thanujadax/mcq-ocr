from doctr.models import recognition_predictor
import numpy as np

class DoctrRecognizer:
    def __init__(self, model_name: str = "master"):
        # Initialize the Doctr recognition model
        self.model = recognition_predictor(model_name,pretrained=True)

    def recognize_student_index(self, index_image: np.ndarray) -> dict:
        """
        Recognizes the student index number from the index number image.

        Args:
            index_image: Image containing the index number.

        Returns:
            A dictionary with the recognized index number and related information.
        """
        # Perform recognition using the Doctr model
        result = self.model([index_image])
        # Extract the recognized text and confidence score
        pred_index = result[0][0]
        confidence = result[0][1]
        return {
            "index_number": pred_index,
            "confidence": confidence
        }
    