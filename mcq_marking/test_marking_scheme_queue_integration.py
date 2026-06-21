# This test is for the integration of a RabbitMQ message queue with a worker service that processes marking scheme configurations.
import pytest
import pika
import threading
import json

# This test file assumes a RabbitMQ server is running in the below configuration:
# and that the worker service is also running and connected to the same RabbitMQ instance using the given queues.
RABBITMQ_URL = 'amqp://admin:secret@localhost:5673/'
INCOMING_QUEUE = 'marking_scheme_config_results'
OUTGOING_QUEUE = 'marking_scheme_config_queue'

TEST_ID = 1
TEST_NAME = 'Test Marking Scheme Config Job'
TEST_TEMPLATE_ID = 1
TEST_TEMPLATE_PATH = 'test/resources/template_output/sample_template_output.jpg'
TEST_TEMPLATE_CONFIG_PATH = 'test/resources/template_output/sample_template_config.json'
TEST_CONFIG_TYPE = 'grid_based'
TEST_MARKING_SCHEME_PATH = 'test/resources/marking_scheme/sample_marking_scheme.jpg'
TEST_MARKING_SCHEME_CONFIG_PATH = 'test/resources/marking_scheme_output/sample_marking_scheme_config.json'
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

#Listener fixture — runs on a background thread with its own connection
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
def test_marking_scheme_config_job_integration(rabbit_publisher):
    marking_scheme_config_job = {
        'id': TEST_ID,
        'name': TEST_NAME,
        'template_id': TEST_TEMPLATE_ID,
        'template_path': TEST_TEMPLATE_PATH,
        'template_config_path': TEST_TEMPLATE_CONFIG_PATH,
        'config_type': TEST_CONFIG_TYPE,
        'marking_scheme_path': TEST_MARKING_SCHEME_PATH,
        'marking_scheme_config_path': TEST_MARKING_SCHEME_CONFIG_PATH,
        'save_intermediate_results': True
    }
    message = json.dumps(marking_scheme_config_job)
    events[TEST_ID] = threading.Event()
    rabbit_publisher.basic_publish(
        exchange='',
        routing_key=OUTGOING_QUEUE,
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=2,  # Make message persistent
        )
    )
    # Wait for the result with a timeout
    event = events[TEST_ID]
    event_waited = event.wait(timeout=30)  # 30 seconds timeout
    assert event_waited, "Did not receive marking scheme config job result in time"
    result = results_db.get(TEST_ID)
    assert result is not None, "No result found for the marking scheme config job"
    assert result['job_id'] == TEST_ID, "Result job_id does not match"
    assert result['status'] == 'completed', "Result status is not completed"
    assert 'result' in result, "Result data is missing"