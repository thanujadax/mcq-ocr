import json
import time
from datetime import datetime
import pika
import os
import logging
from app.autograder.utils.image_processing import read_enhanced_image
from app.models.answer_sheet import AnswerSheet
from app.models.marking_scheme import MarkingScheme
from app.models.template import Template, TemplateConfigType
from app.utils.file_handelling import file_exists, get_spreadsheet, read_answer_sheet_paths, read_json, save_image_using_folder_and_filename, save_spreadsheet

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INDEX_TASK_QUEUE = os.getenv('INDEX_TASK_QUEUE', 'index_task_queue')

class MarkingJob:
    def __init__(self, data: dict, rabbitmq_url: str = "amqp://localhost"):
        '''
        data is a dictionary with the following keys:
        data:
            id: int
            name: str
            template_path: str
            marking_scheme_path: str
            marking_scheme_config_path: str
            answers_folder_path: str
            result_sheet_file_path: str
            config_type: str
            template_config_path: str
            intermediate_results_path: str
            save_intermediate_results: bool
        '''
        self.job_id = data['id']
        self.name = data['name']
        self.template_path = data['template_path']
        self.marking_path = data['marking_scheme_path']
        self.marking_scheme_config_path = data['marking_scheme_config_path']
        self.answers_folder_path = data['answers_folder_path']
        self.output_path = data['result_sheet_file_path']
        self.template_config_path = data['template_config_path']
        self.intermediate_results_path = data['intermediate_results_path']
        self.config_type = data['config_type']
        self.save_intermediate_results = data['save_intermediate_results']
        self.rabbitmq_url = rabbitmq_url
        self.connection = None
        self.channel = None
        self.template = None
        self.marking_scheme = None
        self.answer_sheets = []
        self.spreadsheet_workbook = None
        self.spreadsheet_sheet = None

    def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            self.connection = pika.BlockingConnection(pika.URLParameters(self.rabbitmq_url))
            self.channel = self.connection.channel()
            
            # Declare queues
            self.channel.queue_declare(queue=INDEX_TASK_QUEUE, durable=False)
            
            logger.info("Marking Job Connected to RabbitMQ")
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise
    
    def setup(self, force_recalculate=False):
        self.connect()
        if self.template is None or self.marking_scheme is None or self.answer_sheets is None or self.spreadsheet_workbook is None or self.spreadsheet_sheet is None or force_recalculate:
            template_img = read_enhanced_image(self.template_path, 1.5, resize=False)
            marking_img = read_enhanced_image(self.marking_path, 1)
            template_config = read_json(self.template_config_path)
            marking_scheme_config = read_json(self.marking_scheme_config_path)
            config_type = TemplateConfigType.GRID_BASED if self.config_type == 'grid_based' else TemplateConfigType.CLUSTERING_BASED
            self.template = Template(self.job_id, f'${self.name } Template', template_img, template_config, config_type)
            self.marking_scheme = MarkingScheme(self.job_id, f'${self.name } Marking Scheme', marking_img, self.template, marking_scheme_config)
            logger.info(f"Obtaining papers from {self.answers_folder_path}")
            self.answer_sheets = read_answer_sheet_paths(self.answers_folder_path)
            logger.info(f"Found {len(self.answer_sheets)} answer sheets to process.")
            self.spreadsheet_workbook, self.spreadsheet_sheet = get_spreadsheet(self.output_path, f'${self.name } Results')
            # Clear the sheet before adding new results
            self.spreadsheet_sheet.delete_rows(1, self.spreadsheet_sheet.max_row)
            self.spreadsheet_sheet.append(['Index No', 'Correct', 'Incorrect', 'More than one marked', 'Not marked', 'Columnwise Total', 'Score', 'Flag', 'Flag Reason', 'Answer Sheet Path', 'Labeled Points'])
    
    def mark_answers(self):
        self.setup()
        self.start_time = time.time()
        for i, answer_sheet_path in enumerate(self.answer_sheets):
            logger.info(f"Processing answer sheet: {answer_sheet_path}")
            answer_sheet_img = read_enhanced_image(answer_sheet_path, 1.5)
            answer_sheet = AnswerSheet(self.job_id, i, answer_sheet_path, answer_sheet_img, self.marking_scheme, self.channel, INDEX_TASK_QUEUE)
            results = answer_sheet.get_score(intermediate_results=self.save_intermediate_results)
            results['answer_sheet_path'] = answer_sheet_path
            self.add_to_spreadsheet(results)
            if self.save_intermediate_results:
                save_image_using_folder_and_filename(self.intermediate_results_path, f"{answer_sheet.id}.jpg", answer_sheet.result_img)
                logger.info(f"Saved intermediate results")
        logger.info(f"Saving spreadsheet")
        save_spreadsheet(self.output_path, self.spreadsheet_workbook)
        logger.info(f"Saved spreadsheet")
        if not file_exists(self.output_path):
            logger.error(f"Output path does not exist")
            return False
        logger.info(f"Marking is complete. Results have been saved in {self.output_path}")
        logger.info(f"Total time taken: {time.time() - self.start_time} seconds")

        result = {
            'intermediate_results_path': self.intermediate_results_path,
            'output_path': self.output_path,
            'total_answer_sheets': len(self.answer_sheets),
            'processed_answer_sheets': len(self.answer_sheets),
            'failed_answer_sheets': 0,
            'processing_started_at': datetime.fromtimestamp(self.start_time).isoformat(),
            'processing_completed_at': datetime.now().isoformat(),
            'results_summary': None
        }
        return result

    def add_to_spreadsheet(self, results: dict):
        self.spreadsheet_sheet.append([
            results['index_number'], 
            ','.join(map(str, results['correct'])), 
            ','.join(map(str, results['incorrect'])), 
            ','.join(map(str, results['more_than_one_marked'])), 
            ','.join(map(str, results['not_marked'])), 
            ','.join(map(str, results['columnwise_total'])), 
            results['score'], 
            results['flag'], 
            results['flag_reason'],
            results['answer_sheet_path'],
            json.dumps(results['labeled_points'])
            ])



    def __str__(self):
        return f"Job(id={self.job_id}, name={self.name})"