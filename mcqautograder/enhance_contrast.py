import os
import argparse
from PIL import Image, ImageEnhance

def enhance_contrast(input_path, output_path, factor):
    """
    Enhance the contrast of all JPG images in the input_path and save the results in output_path.
    """
    if not os.path.exists(output_path):
        os.makedirs(output_path)

    for filename in os.listdir(input_path):
        if filename.lower().endswith('.jpg'):
            input_file = os.path.join(input_path, filename)
            output_file = os.path.join(output_path, filename)

            with Image.open(input_file) as img:
                enhancer = ImageEnhance.Contrast(img)
                enhanced_img = enhancer.enhance(factor)
                enhanced_img.save(output_file)
            print(f"Processed {filename}")

def main():
    parser = argparse.ArgumentParser(description="Enhance the contrast of JPG images.")
    parser.add_argument("input_path", type=str, help="Path to the input folder containing JPG images.")
    parser.add_argument("output_path", type=str, help="Path to the output folder to save enhanced images.")
    parser.add_argument("--factor", type=float, default=1.5, help="Contrast enhancement factor. Default is 1.5 (50% increase).")
    args = parser.parse_args()

    enhance_contrast(args.input_path, args.output_path, args.factor)

if __name__ == "__main__":
    main()
