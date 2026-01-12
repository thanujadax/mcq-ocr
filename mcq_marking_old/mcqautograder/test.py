from auto_config.config import get_config
from mcqautograder.autograder import get_answers, get_coordinates_of_bubbles_v2, read_image, visualize_marking_scheme_answers
import cv2

folder_path = "/Users/vihangamunasinghe/WebProjects/DSE Project/mcq-ocr/2023_sample"

def test():
  # Save the template_img as a jpg file and print the path
  template_img, config = get_config(f"{folder_path}/templates/1.jpg", show_intermediate_results=True)
  
  output_path = f"{folder_path}/templates/1_warped.jpg"
  marking_scheme_path = f"{folder_path}/marking_schemes/1.jpg"
  answer_sheet_path = f"{folder_path}/answers/210001A.jpg"

  if hasattr(template_img, 'save'):  # PIL Image
      template_img.save(output_path, "JPEG")
  else:  # Assume numpy array (OpenCV)
      cv2.imwrite(output_path, template_img)
  print("Saved bubble coordinates image to:", output_path)

  template_img = read_image(output_path, 1)
  marking_scheme_img = read_image(marking_scheme_path, 1.5)
  answer_sheet_img = read_image(answer_sheet_path, 1.5)

  config = {
     'bubble_coordinates': config,
     'num_questions': 90,
  }
  bubble_coordinates, choice_distribution = get_coordinates_of_bubbles_v2(config)

  marking_scheme = get_answers(template_img, answer_sheet_img, bubble_coordinates, is_marking_scheme=True, show_intermediate_results=True)
  visualize_marking_scheme_answers(template_img, answer_sheet_img, bubble_coordinates, marking_scheme, f"{folder_path}/answers/")


if __name__ == "__main__":
    test()