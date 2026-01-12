from PIL import Image
from app.autograder.marking import calculate_score, get_answers
from app.autograder.utils.draw_shapes import draw_scatter_points
from app.models.marking_scheme import MarkingScheme
from pika.adapters.blocking_connection import BlockingChannel
from pika import BasicProperties
import json
import numpy as np
import logging

logger = logging.getLogger(__name__)

class AnswerSheet:
    def __init__(self, job_id : int, id : int, path: str, answer_sheet_img : Image, marking_scheme: MarkingScheme, rabbit_channel: BlockingChannel = None, index_task_queue="index_task_queue"):
        self.job_id = job_id
        self.id = id
        self.path = path
        self.answer_sheet_img = answer_sheet_img
        self.marking_scheme = marking_scheme
        self.rabbit_channel = rabbit_channel
        self.index_task_queue = index_task_queue
        self.index_number = None
        self.answers_with_coordinates = None
        self.correct = None
        self.incorrect = None
        self.more_than_one_marked = None
        self.not_marked = None
        self.columnwise_total = None
        self.flag = False
        self.flag_reason = ""
        self.points = None
        self.result_img = None
        self.labeled_points = None

    def get_answers_and_corresponding_points(self, force_recalculate=False):
        if self.answers_with_coordinates is None or force_recalculate:
            bubble_coordinates = self.marking_scheme.template.get_bubble_coordinates()
            self.answers_with_coordinates = get_answers(self.marking_scheme.template.template_img, self.answer_sheet_img, bubble_coordinates)
        return self.answers_with_coordinates
    
    def start_index_recognition(self):
        if self.rabbit_channel is not None:
            task_data = {
                'file_path': self.path,
                'task_id': self.job_id,
                'answer_sheet_id': self.id,
            }
            task_message = json.dumps(task_data)
            self.rabbit_channel.basic_publish(
                exchange='',
                routing_key=self.index_task_queue,
                body=task_message,
                properties=BasicProperties(
                    delivery_mode=2,  # make message persistent
                ))
        else:
            raise ValueError("Rabbit channel is not set for index recognition task.")

    def get_score(self, intermediate_results=False):
        self.start_index_recognition()
        self.get_answers_and_corresponding_points()
        marking_scheme_answers = self.marking_scheme.get_answers_and_corresponding_points()
        choice_distribution = self.marking_scheme.template.get_choice_distribution()
        (
            self.correct,
            self.incorrect,
            self.more_than_one_marked,
            self.not_marked,
            self.columnwise_total,
            self.points,
            self.labeled_points,
        ) = calculate_score(marking_scheme_answers, self.answers_with_coordinates, choice_distribution) # TODO: add facility_index
        logger.info(f"Calculated score")
        # Flagging
        if len(self.more_than_one_marked) > 0:
            self.flag = True
            self.flag_reason = "More than one choice is marked"
        elif len(self.not_marked) > 0:
            self.flag = True
            self.flag_reason = "There are no choices marked questions"
            
        if intermediate_results:
            result_img = self.answer_sheet_img.copy()
            result_img = np.array(result_img)            
            result_img = draw_scatter_points(result_img, self.points["correct"], color=(0, 255, 0))
            result_img = draw_scatter_points(result_img, self.points["incorrect"], color=(0, 0, 255))
            result_img = draw_scatter_points(result_img, self.points["more_than_one_marked"], color=(255, 0, 0))
            result_img = draw_scatter_points(result_img, self.points["not_marked"], color=(255, 255, 0))
            self.result_img = result_img
        return {
            "index_number": self.index_number,
            "correct": self.correct,
            "incorrect": self.incorrect,
            "more_than_one_marked": self.more_than_one_marked,
            "not_marked": self.not_marked,
            "columnwise_total": self.columnwise_total,
            "score": len(self.correct),
            "flag": self.flag,
            "flag_reason": self.flag_reason,
            "labeled_points": self.labeled_points,
            "result_img": self.result_img,
        }

    def __str__(self):
        return f"AnswerSheet(job_id={self.job_id}, id={self.id}, path={self.path})"