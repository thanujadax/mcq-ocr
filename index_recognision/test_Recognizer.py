# pytest cases for Recognizer.py
import pytest
import cv2
import numpy as np
import Recognizer
import os

TEST_RESOURCES_DIR = os.path.join('.','test', 'resources')
TEST_FILENAME = 'detected_index_section.jpg'
CHALLENGING_FILENAME = 'detected_index_section_challenging.jpg'

def test_recognize_index_section():
    # Load test image
    image_path = os.path.join(TEST_RESOURCES_DIR, TEST_FILENAME)
    # check if this file exists
    assert os.path.isfile(image_path), f"Test image not found: {image_path}"
    image = cv2.imread(image_path)
    # ensure the image is loaded
    assert image is not None, "Test image could not be loaded."
    # now test the Recognizer function
    result = Recognizer.recognize_student_index(image)
    # Check if the result is a dictionary
    assert isinstance(result, dict), "Result should be a dictionary."
    # Check if the dictionary contains expected keys
    expected_keys = {'index_number', 'confidence'}
    for key in expected_keys:
        assert key in result, f"Missing key in result: {key}"
    # Check if index_number is a non-empty string
    assert isinstance(result['index_number'], str) and len(result['index_number']) > 0, "Index number should be a non-empty string."
    # Check if confidence is a float between 0 and 1
    assert isinstance(result['confidence'], float) and 0.0 <= result['confidence'] <= 1.0, "Confidence should be a float between 0 and 1."

def test_recognize_index_section_challenging():
    # Load challenging test image
    image_path = os.path.join(TEST_RESOURCES_DIR, CHALLENGING_FILENAME)
    # check if this file exists
    assert os.path.isfile(image_path), f"Challenging test image not found: {image_path}"
    image = cv2.imread(image_path)
    # ensure the image is loaded
    assert image is not None, "Challenging test image could not be loaded."
    # now test the Recognizer function
    result = Recognizer.recognize_student_index(image)
    # Check if the result is a dictionary
    assert isinstance(result, dict), "Result should be a dictionary."
    # Check if the dictionary contains expected keys
    expected_keys = {'index_number', 'confidence'}
    for key in expected_keys:
        assert key in result, f"Missing key in result: {key}"
    print(f"Challenging image recognition result: {result}")
    # Check if index_number is a non-empty string
    assert isinstance(result['index_number'], str) and len(result['index_number']) > 0, "Index number should be a non-empty string."
    # Check if confidence is a float between 0 and 1
    assert isinstance(result['confidence'], float) and 0.0 <= result['confidence'] <= 1.0, "Confidence should be a float between 0 and 1."

def test_recognize_index_section_empty():
    # Create an empty image
    empty_image = np.zeros((100, 100, 3), dtype=np.uint8)
    # now test the Recognizer function
    result = Recognizer.recognize_student_index(empty_image)
    # Check if the result is a dictionary
    assert isinstance(result, dict), "Result should be a dictionary."
    # Check if the dictionary contains expected keys
    expected_keys = {'index_number', 'confidence'}
    for key in expected_keys:
        assert key in result, f"Missing key in result: {key}"
    # Check if index_number is an empty string (since there's nothing to recognize)
    assert isinstance(result['index_number'], str), "Index number should be a string."
    # Check if confidence is a float between 0 and 1
    assert isinstance(result['confidence'], float) and 0.0 <= result['confidence'] <= 1.0, "Confidence should be a float between 0 and 1."

def test_recognize_index_section_zero_height():
    # Create an image with zero height
    zero_height_image = np.zeros((0, 100, 3), dtype=np.uint8)
    # now test the Recognizer function(RuntimeError is expected)
    with pytest.raises(RuntimeError):
        Recognizer.recognize_student_index(zero_height_image)