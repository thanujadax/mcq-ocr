# This test is for the integration of a RabbitMQ message queue with a worker service that processes multiple-choice question (MCQ) marking tasks.
import pytest
import pika
import threading
import json
import time

# This test file assumes a RabbitMQ server is running in the below configuration:
# and that the worker service is also running and connected to the same RabbitMQ instance using the given queues.
RABBITMQ_URL = 'amqp://admin:secret@localhost:5673/'
INCOMING_QUEUE = 'marking_job_results'
OUTGOING_QUEUE = 'marking_job_queue'

TEST_MARKING_JOB_ID = 1
TEST_MARKING_JOB_NAME = 'Sample Marking Job'
TEST_TEMPLATE_ID = 1
TEST_TEMPLATE_PATH = 'test/resources/template_output/sample_template_output.jpg'
TEST_TEMPLATE_CONFIG_PATH = 'test/resources/template_output/sample_template_config.json'
TEST_CONFIG_TYPE = 'grid_based'
TEST_MARKING_SCHEME_PATH = 'test/resources/marking_scheme/sample_marking_scheme.jpg'
TEST_MARKING_SCHEME_CONFIG_PATH = 'test/resources/marking_scheme_output/sample_marking_scheme_config.json'
TEST_ANSWER_SHEETS_FOLDER = 'test/resources/sample_answers/'
TEST_RESULT_SHEET_FILE_PATH = 'test/resources/output/result_sheet.xlsx'
TEST_INTERMEDIATE_RESULTS_PATH = 'test/resources/output/intermediate_results/'

TEST_INDEX_LIST_CSV_FILE_PATH = 'test/resources/index_list.csv'
TEST_INDEX_LIST_EXCEL_FILE_PATH = 'test/resources/index_list.xlsx'

NUMBER_OF_ANSWER_SHEETS = 5  # the test case assumes there are this many answer sheets in the folder
# Shared structures
events = {}
results_db = {}
# Publisher fixture — safe, short-lived connections
@pytest.fixture
def rabbit_publisher():
    connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
    channel = connection.channel()
    channel.queue_declare(queue=INCOMING_QUEUE, durable=True)
    channel.queue_declare(queue=OUTGOING_QUEUE, durable=True)
    yield channel
    channel.close()
    connection.close()

# Listener fixture — runs on a background thread with its own connection
@pytest.fixture(scope="module", autouse=True)
def start_listener():
    stop_event = threading.Event()

    def callback(ch, method, properties, body):
        message = body.decode()
        task = json.loads(message)
        task_id = task.get('job_id')
        results_db[task_id] = task
        if task_id in events:
            events[task_id].set()
        else:
            print(f"⚠ Received unexpected marking_job_id: {task_id}")

    def listen():
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        channel = connection.channel()
        channel.queue_declare(queue=INCOMING_QUEUE, durable=True)
        channel.basic_consume(queue=INCOMING_QUEUE, on_message_callback=callback, auto_ack=True)
        while not stop_event.is_set():
            connection.process_data_events(time_limit=1)
        channel.close()
        connection.close()

    listener_thread = threading.Thread(target=listen, daemon=True)
    listener_thread.start()
    yield
    stop_event.set()
    listener_thread.join()

# Test function to send a marking job and wait for the result
def test_marking_job_integration(rabbit_publisher):
    marking_job = {
        'id': TEST_MARKING_JOB_ID,
        'name': TEST_MARKING_JOB_NAME,
        'template_id': TEST_TEMPLATE_ID,
        'template_path': TEST_TEMPLATE_PATH,
        'template_config_path': TEST_TEMPLATE_CONFIG_PATH,
        'config_type': TEST_CONFIG_TYPE,
        'marking_scheme_path': TEST_MARKING_SCHEME_PATH,
        'marking_scheme_config_path': TEST_MARKING_SCHEME_CONFIG_PATH,
        'answers_folder_path': TEST_ANSWER_SHEETS_FOLDER,
        'result_sheet_file_path': TEST_RESULT_SHEET_FILE_PATH,
        'intermediate_results_path': TEST_INTERMEDIATE_RESULTS_PATH,
        'save_intermediate_results': True
    }
    message = json.dumps(marking_job)
    events[TEST_MARKING_JOB_ID] = threading.Event()
    rabbit_publisher.basic_publish(
        exchange='',
        routing_key=OUTGOING_QUEUE,
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=2,  # make message persistent
        )
    )
    # Wait for the result with a timeout
    event = events[TEST_MARKING_JOB_ID]
    # expect Number of answer sheets messages
    for i in range(NUMBER_OF_ANSWER_SHEETS):
        event.wait(timeout=30)
        assert event.is_set(), "Timeout waiting for marking job result"
        event.clear()
        result = results_db.get(TEST_MARKING_JOB_ID)
        assert result is not None, "No result found for the marking job"
        assert result['job_id'] == TEST_MARKING_JOB_ID, "Result job_id does not match"
        assert result['status'] == 'processing', f"Marking job not processing as expected, got status: {result['status']}"
        assert 'result' in result, "No result data found in the marking job result"
        assert result['result']['completed'] == i + 1, f"Expected completed count {i + 1}, got {result['result']['completed']}"

# Test function to send a marking job and wait with CSV index list
def test_marking_job_integration_with_csv_index_list(rabbit_publisher):
    marking_job = {
        'id': TEST_MARKING_JOB_ID + 1,
        'name': TEST_MARKING_JOB_NAME + ' with CSV Index List',
        'template_id': TEST_TEMPLATE_ID,
        'template_path': TEST_TEMPLATE_PATH,
        'template_config_path': TEST_TEMPLATE_CONFIG_PATH,
        'config_type': TEST_CONFIG_TYPE,
        'marking_scheme_path': TEST_MARKING_SCHEME_PATH,
        'marking_scheme_config_path': TEST_MARKING_SCHEME_CONFIG_PATH,
        'answers_folder_path': TEST_ANSWER_SHEETS_FOLDER,
        'result_sheet_file_path': TEST_RESULT_SHEET_FILE_PATH,
        'intermediate_results_path': TEST_INTERMEDIATE_RESULTS_PATH,
        'index_list_file_path': TEST_INDEX_LIST_CSV_FILE_PATH,
        'save_intermediate_results': True
    }
    message = json.dumps(marking_job)
    events[TEST_MARKING_JOB_ID + 1] = threading.Event()
    rabbit_publisher.basic_publish(
        exchange='',
        routing_key=OUTGOING_QUEUE,
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=2,  # make message persistent
        )
    )
    # Wait for the result with a timeout
    event = events[TEST_MARKING_JOB_ID + 1]
    # expect Number of answer sheets messages
    for i in range(NUMBER_OF_ANSWER_SHEETS):
        event.wait(timeout=30)
        assert event.is_set(), "Timeout waiting for marking job result with CSV index list"
        event.clear()
        result = results_db.get(TEST_MARKING_JOB_ID + 1)
        assert result is not None, "No result found for the marking job with CSV index list"
        assert result['job_id'] == TEST_MARKING_JOB_ID + 1, "Result job_id does not match for CSV index list"
        assert result['status'] == 'processing', f"Marking job not processing as expected for CSV index list, got status: {result['status']}"
        assert 'result' in result, "No result data found in the marking job result for CSV index list"
        assert result['result']['completed'] == i + 1, f"Expected completed count {i + 1} for CSV index list, got {result['result']['completed']}"

# Test function to send a marking job and wait with Excel index list
def test_marking_job_integration_with_excel_index_list(rabbit_publisher):
    marking_job = {
        'id': TEST_MARKING_JOB_ID + 2,
        'name': TEST_MARKING_JOB_NAME + ' with Excel Index List',
        'template_id': TEST_TEMPLATE_ID,
        'template_path': TEST_TEMPLATE_PATH,
        'template_config_path': TEST_TEMPLATE_CONFIG_PATH,
        'config_type': TEST_CONFIG_TYPE,
        'marking_scheme_path': TEST_MARKING_SCHEME_PATH,
        'marking_scheme_config_path': TEST_MARKING_SCHEME_CONFIG_PATH,
        'answers_folder_path': TEST_ANSWER_SHEETS_FOLDER,
        'result_sheet_file_path': TEST_RESULT_SHEET_FILE_PATH,
        'intermediate_results_path': TEST_INTERMEDIATE_RESULTS_PATH,
        'index_list_file_path': TEST_INDEX_LIST_EXCEL_FILE_PATH,
        'save_intermediate_results': True
    }
    message = json.dumps(marking_job)
    events[TEST_MARKING_JOB_ID + 2] = threading.Event()
    rabbit_publisher.basic_publish(
        exchange='',
        routing_key=OUTGOING_QUEUE,
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=2,  # make message persistent
        )
    )
    # Wait for the result with a timeout
    event = events[TEST_MARKING_JOB_ID + 2]
    # expect Number of answer sheets messages
    for i in range(NUMBER_OF_ANSWER_SHEETS):
        event.wait(timeout=30)
        assert event.is_set(), "Timeout waiting for marking job result with Excel index list"
        event.clear()
        result = results_db.get(TEST_MARKING_JOB_ID + 2)
        assert result is not None, "No result found for the marking job with Excel index list"
        assert result['job_id'] == TEST_MARKING_JOB_ID + 2, "Result job_id does not match for Excel index list"
        assert result['status'] == 'processing', f"Marking job not processing as expected for Excel index list, got status: {result['status']}"
        assert 'result' in result, "No result data found in the marking job result for Excel index list"
        assert result['result']['completed'] == i + 1, f"Expected completed count {i + 1} for Excel index list, got {result['result']['completed']}"