import json
import time
from datetime import datetime
from typing import Callable
import pika
import os
import logging
import threading
from app.autograder.utils.image_processing import enhance_image, read_enhanced_image, read_resize_image
from app.models.answer_sheet import AnswerSheet
from app.models.marking_scheme import MarkingScheme
from app.models.template import Template, TemplateConfigType
from app.utils.file_handelling import file_exists, get_spreadsheet, read_answer_sheet_paths, read_json, save_image_using_folder_and_filename, save_spreadsheet, get_column_from_file
from app.anomalydetection.anomaly_detector import AnomalyDetector
from app.utils.EventRegistery import EventRegistery
from app.utils.ThreadSafeDict import ThreadSafeDict
from app.indexListner.indexValidator import get_matching_index, get_regex_from_list

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INDEX_TASK_QUEUE = os.getenv('INDEX_TASK_QUEUE', 'index_task_queue')


class MarkingJob:
    def __init__(self, data: dict, rabbitmq_url: str = "amqp://localhost", progress_callback: Callable[[int,int], None]=None,
                 event_registery: EventRegistery = None, temp_data_store: ThreadSafeDict = None):
        """
        Initialize a MarkingJob instance.

        Args:
            data (dict): Dictionary with the following keys:
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
            progress_callback (callable, optional): Function to report progress. Defaults to None.
            rabbitmq_url (str, optional): RabbitMQ connection URL. Defaults to "amqp://localhost".
        """
        self.job_id = data.get('id')
        self.name = data.get('name')
        self.template_path = data.get('template_path')
        self.marking_path = data.get('marking_scheme_path')
        self.marking_scheme_config_path = data.get('marking_scheme_config_path')
        self.answers_folder_path = data.get('answers_folder_path')
        self.output_path = data.get('result_sheet_file_path')
        self.template_config_path = data.get('template_config_path')
        self.intermediate_results_path = data.get('intermediate_results_path')
        self.config_type = data.get('config_type')
        self.save_intermediate_results = data.get('save_intermediate_results')
        self.index_list_file_path = data.get('index_list_file_path', None)
        self.rabbitmq_url = rabbitmq_url
        self.progress_callback = progress_callback

        self.connection = None
        self.channel = None
        self.anomaly_detector = None
        self.template = None
        self.marking_scheme = None
        self.answer_sheets = []
        self.spreadsheet_workbook = None
        self.spreadsheet_sheet = None
        self.total_answer_sheets = 0
        self.processed_answer_sheets = 0
        self.failed_answer_sheets = 0
        self.available_index_numbers = None

        self.event_registery = event_registery
        self.temp_data_store = temp_data_store

    def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            self.connection = pika.BlockingConnection(pika.URLParameters(self.rabbitmq_url))
            self.channel = self.connection.channel()
            
            # Declare queues
            self.channel.queue_declare(queue=INDEX_TASK_QUEUE, durable=True)
            
            logger.info("Marking Job Connected to RabbitMQ")
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise
    
    def setup(self, force_recalculate=False):
        self.connect()
        if self.index_list_file_path and file_exists(self.index_list_file_path):
            # Check if index list file is .csv or .xlsx
            try:
                self.available_index_numbers = get_column_from_file(self.index_list_file_path, 'Index No')
                logger.info(f"Loaded {len(self.available_index_numbers)} index numbers from {self.index_list_file_path}")
            except Exception as e:
                logger.error(f"Failed to load index numbers from {self.index_list_file_path}: {e}")
        if self.template is None or self.marking_scheme is None or self.answer_sheets is None or self.spreadsheet_workbook is None or self.spreadsheet_sheet is None or force_recalculate:
            template_img = read_resize_image(self.template_path, resize=False)

            # Create the AnomalyDetector
            self.anomaly_detector = AnomalyDetector(template_img, threashold=1700) # Adjust threshold as needed

            template_img = enhance_image(template_img,1.5)
            marking_img = read_enhanced_image(self.marking_path, 1.8)
            template_config = read_json(self.template_config_path)
            marking_scheme_config = read_json(self.marking_scheme_config_path)
            config_type = TemplateConfigType.GRID_BASED if self.config_type == 'grid_based' else TemplateConfigType.CLUSTER_BASED
            self.template = Template(self.job_id, f'${self.name } Template', template_img, template_config, config_type)
            self.marking_scheme = MarkingScheme(self.job_id, f'${self.name } Marking Scheme', marking_img, self.template, marking_scheme_config)
            logger.info(f"Obtaining papers from {self.answers_folder_path}")
            self.answer_sheets = read_answer_sheet_paths(self.answers_folder_path)
            self.total_answer_sheets = len(self.answer_sheets)
            logger.info(f"Found {self.total_answer_sheets} answer sheets to process.")
            self.spreadsheet_workbook, self.spreadsheet_sheet = get_spreadsheet(self.output_path, f'${self.name } Results')
            # Clear the sheet before adding new results
            self.spreadsheet_sheet.delete_rows(1, self.spreadsheet_sheet.max_row)
            base_headers = ['Index No', 'Correct', 'Incorrect', 'More than one marked', 'Not marked', 'Score', 'Flag', 'Flag Reason', 'Answer Sheet Path', 'Labeled Points', 'Resolved']
            if self.save_intermediate_results:
                self.spreadsheet_sheet.append(base_headers + ['Audit File Name'])
            else:
                self.spreadsheet_sheet.append(base_headers)
    
    def mark_answers(self):
        self.setup()
        self.start_time = time.time()
        for i, answer_sheet_path in enumerate(self.answer_sheets):
            try:
                logger.info(f"Processing answer sheet: {answer_sheet_path}")
                answer_sheet_img = read_resize_image(answer_sheet_path)

                #Detect Anomalies
                if self.anomaly_detector:
                    anomalies_detected, count = self.anomaly_detector.check(answer_sheet_img)

                answer_sheet_img = enhance_image(answer_sheet_img, 1.5)
                answer_sheet = AnswerSheet(self.job_id, i, answer_sheet_path, answer_sheet_img, self.marking_scheme, self.channel, INDEX_TASK_QUEUE)
                
                # set up the event for index retrieval
                event = None
                if self.event_registery and self.temp_data_store:
                    event = self.event_registery.create_event(self.job_id) # type: threading.Event
                results = answer_sheet.get_score(intermediate_results=self.save_intermediate_results)
                # wait for the index number to be set by the index listener
                index_number = "None"
                if self.event_registery and self.temp_data_store:
                    event.wait(timeout=30)  # wait for up to 30 seconds
                    result = self.temp_data_store.get(self.job_id)
                    if result and 'index_number' in result:
                        index_number = result['index_number']
                else:
                    logger.info("Event registery or temp data store not set, skipping index recognition wait.")
                # Validate index number
                if index_number != "None" and self.available_index_numbers:
                    regex_str = get_regex_from_list(self.available_index_numbers)
                    validated_index_number, is_exact_match, is_guess = get_matching_index(index_number, regex_str, self.available_index_numbers)
                    if not is_exact_match:
                        results['flag'] = True
                        if is_guess:
                            results['flag_reason'] += ('' if (not results['flag_reason'] or results['flag_reason'] == '') else ', ') + 'Index number ambiguous'
                        else:
                            results['flag_reason'] += ('' if (not results['flag_reason'] or results['flag_reason'] == '') else ', ') + 'Index number ambiguous'
                    index_number = validated_index_number
                results['index_number'] = index_number
                results['answer_sheet_path'] = answer_sheet_path
                # Anomaly flags
                if anomalies_detected:
                    results['flag'] = anomalies_detected
                    #results['flag_reason'] = ('' if (not results['flag_reason'] or results['flag_reason'] =='') else f'{results['flag_reason']}, ') + 'Unussual marks detected'
                    results['flag_reason'] = ('' if (not results['flag_reason'] or results['flag_reason'] == '') else f'{results["flag_reason"]}, ') + 'Unusual marks detected'

                if self.save_intermediate_results:
                    audit_file_name = f"{answer_sheet.id}.jpg"
                    save_image_using_folder_and_filename(self.intermediate_results_path, audit_file_name, answer_sheet.result_img)
                    results['audit_file_name'] = audit_file_name
                    logger.info(f"Saved intermediate results")
                self.add_to_spreadsheet(results)
                #update progress
                self.processed_answer_sheets += 1
            except Exception as e:
                logger.error(f"Error processing answer sheet: {answer_sheet_path}")
                logger.error(f"Error: {e}")
                self.failed_answer_sheets += 1
            finally:
                # Send progress to backend
                self.progress_callback(self.processed_answer_sheets, self.total_answer_sheets)
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
            'processed_answer_sheets': self.processed_answer_sheets,
            'failed_answer_sheets': self.failed_answer_sheets,
            'processing_started_at': datetime.fromtimestamp(self.start_time).isoformat(),
            'processing_completed_at': datetime.now().isoformat(),
            'results_summary': None
        }
        return result

    def add_to_spreadsheet(self, results: dict):
        append_data = [
            results['index_number'],
            ','.join(map(str, results['correct'])),
            ','.join(map(str, results['incorrect'])),
            ','.join(map(str, results['more_than_one_marked'])),
            ','.join(map(str, results['not_marked'])),
            results['score'],
            results['flag'],
            results['flag_reason'],
            results['answer_sheet_path'],
            json.dumps(results['labeled_points'],),
            False,  # Resolved (column K) — defaults to unresolved; user marks via UI
        ]
        if self.save_intermediate_results:
            append_data.append(results['audit_file_name'])

        self.spreadsheet_sheet.append(append_data)
        

    def __str__(self):
        return f"Job(id={self.job_id}, name={self.name})"