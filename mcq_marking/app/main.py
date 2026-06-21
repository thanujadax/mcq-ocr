import logging
import os
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
    stream=sys.stdout,
)
logging.getLogger("pika").setLevel(logging.WARNING)

from app.markingworker.markingworker import MCQMarkingWorker
from app.indexListner.IndexListner import IndexListner
from app.utils.EventRegistery import EventRegistery
from app.utils.ThreadSafeDict import ThreadSafeDict

def main():
    # Get RabbitMQ URL from environment variable or use default
    rabbitmq_url = os.getenv('RABBITMQ_URL', 'amqp://admin:secret@localhost:5672/')

    template_config_queue = os.getenv('TEMPLATE_CONFIG_QUEUE', 'template_config_queue')
    marking_config_queue = os.getenv('MARKING_CONFIG_QUEUE', 'marking_config_queue')
    marking_job_queue = os.getenv('MARKING_JOB_QUEUE', 'marking_job_queue')
    marking_job_results_queue = os.getenv('MARKING_JOB_RESULTS_QUEUE', 'marking_job_results')
    template_config_results_queue = os.getenv('TEMPLATE_CONFIG_RESULTS_QUEUE', 'template_config_results')
    marking_config_results_queue = os.getenv('MARKING_CONFIG_RESULTS_QUEUE', 'marking_config_results')

    index_results_queue = os.getenv('INDEX_RESULTS_QUEUE', 'index_results_queue')

    # Create the event registery
    event_registery = EventRegistery()
    # Create a thread-safe dictionary to store temporary data
    temp_data_store = ThreadSafeDict()
    
    # Index Listener
    index_listener = IndexListner(rabbitmq_url, event_registery, temp_data_store, index_results_queue)
    index_listener.start()

    # MCQ Marking Worker
    worker = MCQMarkingWorker(rabbitmq_url, template_config_queue, marking_job_queue, marking_config_queue, marking_job_results_queue, template_config_results_queue, marking_config_results_queue,
                              event_registery, temp_data_store)
    worker.run()

if __name__ == "__main__":
    main()