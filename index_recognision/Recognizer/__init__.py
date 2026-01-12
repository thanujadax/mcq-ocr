import numpy as np
from .DoctrRecognizer import DoctrRecognizer

recognizer = DoctrRecognizer()

def recognize_student_index(index_image: np.ndarray) -> dict:
    """
    Recognizes the student index number from the index number image.

    Args:
        index_image: Image containing the index number.

    Returns:
        A dictionary with the recognized index number and related information.
    """
    return recognizer.recognize_student_index(index_image)