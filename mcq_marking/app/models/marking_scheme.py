from app.autograder.marking import get_answers
from PIL import Image

from app.models.template import Template

import logging

logger = logging.getLogger(__name__)


class MarkingScheme:
    def __init__(self, job_id: int, name: str, marking_scheme_img: Image.Image, template: Template, marking_scheme_config: dict = None):
        self.job_id = job_id
        self.name = name
        self.template = template
        self.marking_scheme_img = marking_scheme_img
        self.answers_with_coordinates = None
        self.marking_scheme_config = marking_scheme_config if marking_scheme_config is not None else None

    def get_answers_and_corresponding_points(self, force_recalculate=False):
        """
        Returns the answers and their corresponding coordinates from the marking scheme.
        If already calculated and force_recalculate is False, returns the cached result.
        Otherwise, recalculates using get_answers.
        """
        if self.answers_with_coordinates is not None and not force_recalculate:
            return self.answers_with_coordinates

        # If marking_scheme_config is provided and contains answers_with_coordinates, use it
        if (
            self.marking_scheme_config is not None
            and isinstance(self.marking_scheme_config, dict)
            and "answers_with_coordinates" in self.marking_scheme_config
            and not force_recalculate
        ):
            self.answers_with_coordinates = self.marking_scheme_config["answers_with_coordinates"]
            return self.answers_with_coordinates

        # Otherwise, recalculate using get_answers
        bubble_coordinates = self.template.get_bubble_coordinates()
        self.answers_with_coordinates = get_answers(self.template.template_img, self.marking_scheme_img, bubble_coordinates)
        return self.answers_with_coordinates

    def __str__(self):
        return f"MarkingScheme(job_id={self.job_id}, name={self.name})"