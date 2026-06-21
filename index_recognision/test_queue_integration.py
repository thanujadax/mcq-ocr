# tests/integration/test_queue_integration.py
import pytest
import pika
import threading
import json
import time

# This test file assumes a RabbitMQ server is running in the below configuration:
# and that the worker service is also running and connected to the same RabbitMQ instance using the given queues.
# It is also assumed that the 'test/resources/sample_student_sheet.jpg' file exists withing the worker service context.

RABBITMQ_URL = 'amqp://admin:secret@localhost:5673/'
INCOMING_QUEUE = 'index_results'
OUTGOING_QUEUE = 'index_tasks'
TEST_FILE_PATH = 'test/resources/sample_student_sheet.jpg'

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
        task_id = task.get('task_id')
        results_db[task_id] = task
        if task_id in events:
            events[task_id].set()
        else:
            print(f"⚠ Received unexpected task_id: {task_id}")

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
    listener_thread.join(timeout=5)


def test_queue_integration_success(rabbit_publisher):
    task_id = 'test_task_001'
    task = {
        'task_id': task_id,
        'file_path': TEST_FILE_PATH
    }
    message = json.dumps(task)

    index_event = threading.Event()
    events[task_id] = index_event

    rabbit_publisher.basic_publish(exchange='', routing_key=OUTGOING_QUEUE, body=message)
    print(f" [x] Sent task: {task_id}")

    event_set = index_event.wait(timeout=30)
    assert event_set, "❌ Did not receive response in time"
    assert task_id in results_db, "❌ Task ID not found in results"
    result = results_db[task_id]

    assert result.get('error_flag') is False, "Error flag is unexpectedly True"
    assert 'confidence' in result, "Result missing confidence"
    assert 0 <= result['confidence'] <= 1, "Confidence score out of range"
    assert 'index_number' in result and isinstance(result['index_number'], str), "Invalid index_number"
    print(f" [✔] Received result: {result}")


def test_queue_integration_invalid_path(rabbit_publisher):
    task_id = 'test_task_002'
    task = {
        'task_id': task_id,
        'file_path': 'non_existent_file.jpg'
    }
    message = json.dumps(task)

    index_event = threading.Event()
    events[task_id] = index_event

    rabbit_publisher.basic_publish(exchange='', routing_key=OUTGOING_QUEUE, body=message)
    print(f" [x] Sent invalid path task: {task_id}")

    event_set = index_event.wait(timeout=30)
    assert event_set, "❌ No response for invalid path"
    assert task_id in results_db, "❌ Task ID missing in results for invalid path"
    result = results_db[task_id]

    assert result.get('error_flag') is True, "Error flag not set for invalid path"
    print(f" [✔] Received error result: {result}")
