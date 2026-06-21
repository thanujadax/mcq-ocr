################################ Imports ##########################
import Detector
import Recognizer
import numpy as np
import cv2
import os

################################ Functions ##########################
def preprocess(file_path) -> np.ndarray:
    print(f"Preprocessing file: {file_path}")
    image = cv2.imread(file_path)
    return image
    # Add preprocessing code here
def postprocess(data):
    print(f"Postprocessing data...")
    return data
    # Add postprocessing code here

################################ Main Code ##########################
def main():
    ## Detect the index section from the input image
    file_path = "test/input/V1-MPR-_0001.jpg"
    image = preprocess(file_path)
    index_image = Detector.get_index_section(image)
    os.makedirs("test/output", exist_ok=True)
    cv2.imwrite("test/output/detected_index.jpg", index_image)
    print(f"Detected index section saved to test/output/detected_index.jpg")

    ## Recognize the student index from the detected index section
    index_image = preprocess("test/output/detected_index.jpg")
    data = Recognizer.recognize_student_index(index_image)
    data = postprocess(data)
    print(f"data: {data}")

if __name__ == "__main__":
    main()