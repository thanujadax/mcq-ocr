from PIL import Image, ImageEnhance
import cv2
import numpy as np

from app.utils.file_handelling import read_image


def read_enhanced_image(path, enhance_contrast_val, resize = True):
    img = read_image(path, convert_to_grayscale=True)
    if resize:
        img = img.resize((1200, 1600))
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(enhance_contrast_val)
    color = ImageEnhance.Color(img)
    img = color.enhance(0.0)
    return img


def get_homography(img1, img2):
    orig_image = np.array(img1)
    skewed_image = np.array(img2)
    
    print(f"Template image shape: {orig_image.shape}")
    print(f"Answer image shape: {skewed_image.shape}")
    
    # using SIFT for feature matching (more robust than SURF)
    try:
        sift = cv2.SIFT_create(nfeatures=1000)
    except Exception:
        sift = cv2.SIFT_create()
    
    # Finding the matching features between the two images
    kp1, des1 = sift.detectAndCompute(orig_image, None)
    kp2, des2 = sift.detectAndCompute(skewed_image, None)
    
    print(f"Template keypoints: {len(kp1)}")
    print(f"Answer keypoints: {len(kp2)}")
    
    if des1 is None or des2 is None:
        print("No descriptors found in one or both images")
        return None
    
    # Using the FLANN detector to remove the outliers
    FLANN_INDEX_KDTREE = 1
    index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
    search_params = dict(checks=50)
    flann = cv2.FlannBasedMatcher(index_params, search_params)
    matches = flann.knnMatch(des1, des2, k=2)
    
    # Apply Lowe's ratio test
    good = []
    for m, n in matches:
        if m.distance < 0.75 * n.distance:  # More lenient ratio
            good.append(m)
    
    print(f"Good matches found: {len(good)}")
    
    # Setting the min match count for the match count of labels
    MIN_MATCH_COUNT = 15  # Increased minimum matches
    if len(good) > MIN_MATCH_COUNT:
        src_pts = np.float32(
            [kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
        dst_pts = np.float32(
            [kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
        
        print(f"Source points shape: {src_pts.shape}")
        print(f"Destination points shape: {dst_pts.shape}")
        
        H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
        
        if H is not None:
            print(f"Homography matrix calculated successfully")
            print(f"Homography matrix:\n{H}")
        else:
            print("Failed to calculate homography matrix")
    else:
        print(f"Not enough matches found: {len(good)}/{MIN_MATCH_COUNT}")
        H = None
    return H

def get_binary_image(img):
    img = np.array(img)
    # Thresholding the image using threshold
    binaryImg = (img < 200).astype(np.uint8)
    # To improve our accuracy we do opening to succesfully white circles
    kernel = np.ones((5, 5), np.uint8)
    binaryImg = cv2.morphologyEx(binaryImg, cv2.MORPH_OPEN, kernel)
    return binaryImg