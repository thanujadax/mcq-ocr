# pytest test cases for Detector.py
import pytest
import cv2
import numpy as np
import Detector
import os

TEST_RESOURCES_DIR = os.path.join('test', 'resources')
TEST_FILENAME = 'sample_student_sheet.jpg'
CHALLENGING_FILENAME = 'challenging_student_sheet.jpg'

def test_detect_index_section():
    # Load test image
    image_path = os.path.join(TEST_RESOURCES_DIR, TEST_FILENAME)
    # check if this file exists
    assert os.path.isfile(image_path), f"Test image not found: {image_path}"
    image = cv2.imread(image_path)
    # ensure the image is loaded
    assert image is not None, "Test image could not be loaded."
    # now test the Detector function
    index_section = Detector.get_index_section(image)
    # Check if the output is a numpy array
    assert isinstance(index_section, np.ndarray), "Output is not a numpy array."
    # Check if the output image has non-zero dimensions
    assert index_section.size > 0, "Output image has zero size."
    # Check if output dimensions are smaller than input dimensions
    assert index_section.shape[0] < image.shape[0] and index_section.shape[1] < image.shape[1], "Output image dimensions are not smaller than input image dimensions."
    # output will be saved to resources for manual inspection
    output_path = os.path.join(TEST_RESOURCES_DIR, 'detected_index_section.jpg')
    cv2.imwrite(output_path, index_section)

def test_detect_index_section_challenging():
    # Load challenging test image
    image_path = os.path.join(TEST_RESOURCES_DIR, CHALLENGING_FILENAME)
    # check if this file exists
    assert os.path.isfile(image_path), f"Challenging test image not found: {image_path}"
    image = cv2.imread(image_path)
    # ensure the image is loaded
    assert image is not None, "Challenging test image could not be loaded."
    # now test the Detector function
    index_section = Detector.get_index_section(image)
    # Check if the output is a numpy array
    assert isinstance(index_section, np.ndarray), "Output is not a numpy array."
    # Check if the output image has non-zero dimensions
    assert index_section.size > 0, "Output image has zero size."
    # Check if output dimensions are smaller than input dimensions
    assert index_section.shape[0] < image.shape[0] and index_section.shape[1] < image.shape[1], "Output image dimensions are not smaller than input image dimensions."
    # output will be saved to resources for manual inspection
    output_path = os.path.join(TEST_RESOURCES_DIR, 'detected_index_section_challenging.jpg')
    cv2.imwrite(output_path, index_section)

def test_detect_index_section_empty():
    # Create an empty image
    empty_image = np.zeros((100, 100, 3), dtype=np.uint8)
    # now test the Detector function
    index_section = Detector.get_index_section(empty_image)
    # Check if the output is a numpy array
    assert isinstance(index_section, np.ndarray), "Output is not a numpy array."
    # Check if the output still has non-zero dimensions (it may return the original image)
    assert index_section.size > 0, "Output image has zero size."