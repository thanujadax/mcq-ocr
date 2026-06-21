# This test is for the integration of a RabbitMQ message queue with a worker service that processes template configuration jobs.
import pytest
import pika
import threading
import json

TEST_ID = 1
TEST_NAME = 'Sample Template Config Job'
TEST_CONFIG_TYPE = 'grid_based'
TEST_TEMPLATE_PATH = 'test/resources/template/V1.jpg'
TEST_TEMPLATE_CONFIG_PATH = 'test/resources/template_output/sample_template_config.json'
TEST_OUTPUT_IMAGE_PATH = 'test/resources/template_output/sample_template_output.jpg'
TEST_DEBUG_IMAGE_PATH = 'test/resources/template_output/sample_template_debug.jpg'
TEST_NUM_OF_COLUMNS = 3
TEST_NUM_OF_ROWS_PER_COLUMN = 30
TEST_NUM_OF_OPTIONS_PER_QUESTION = 5

# This test file assumes a RabbitMQ server is running in the below configuration:
# and that the worker service is also running and connected to the same RabbitMQ instance using the given queues.
RABBITMQ_URL = 'amqp://admin:secret@localhost:5673/'
INCOMING_QUEUE = 'template_config_results'
OUTGOING_QUEUE = 'template_config_queue'

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
def test_template_config_job_integration(rabbit_publisher):
    template_config_job = {
        'id': TEST_ID,
        'name': TEST_NAME,
        'config_type': TEST_CONFIG_TYPE,
        'template_path': TEST_TEMPLATE_PATH,
        'template_config_path': TEST_TEMPLATE_CONFIG_PATH,
        'output_image_path': TEST_OUTPUT_IMAGE_PATH,
        'debug_image_path': TEST_DEBUG_IMAGE_PATH,
        'num_of_columns': TEST_NUM_OF_COLUMNS,
        'num_of_rows_per_column': TEST_NUM_OF_ROWS_PER_COLUMN,
        'num_of_options_per_question': TEST_NUM_OF_OPTIONS_PER_QUESTION,
        'save_intermediate_results': True
    }
    message = json.dumps(template_config_job)
    correlation_id = TEST_ID
    events[correlation_id] = threading.Event()
    rabbit_publisher.basic_publish(
        exchange='',
        routing_key=OUTGOING_QUEUE,
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=2,
        )
    )
    # Wait for the result with a timeout
    event = events[correlation_id]
    event_waited = event.wait(timeout=30)  # 30 seconds timeout
    assert event_waited, "Timeout waiting for template configuration job result"
    result = results_db.get(correlation_id)
    assert result is not None, "No result found for the template configuration job"
#   assert result['job_id'] == TEST_ID
    assert result.get('status') == 'completed', f"Template configuration job failed with status: {result.get('status')}"
    assert 'result' in result, "No result data found in the template configuration job result"