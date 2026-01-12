import os
from app.markingworker.markingworker import MCQMarkingWorker


def main():
    # Get RabbitMQ URL from environment variable or use default
    rabbitmq_url = os.getenv('RABBITMQ_URL', 'amqp://admin:secret@localhost:5672/')

    template_config_queue = os.getenv('TEMPLATE_CONFIG_QUEUE', 'template_config_queue')
    marking_config_queue = os.getenv('MARKING_CONFIG_QUEUE', 'marking_config_queue')
    marking_job_queue = os.getenv('MARKING_JOB_QUEUE', 'marking_job_queue')
    marking_job_results_queue = os.getenv('MARKING_JOB_RESULTS_QUEUE', 'marking_job_results')
    template_config_results_queue = os.getenv('TEMPLATE_CONFIG_RESULTS_QUEUE', 'template_config_results')
    marking_config_results_queue = os.getenv('MARKING_CONFIG_RESULTS_QUEUE', 'marking_config_results')
    
    worker = MCQMarkingWorker(rabbitmq_url, template_config_queue, marking_job_queue, marking_config_queue, marking_job_results_queue, template_config_results_queue, marking_config_results_queue)
    worker.run()

if __name__ == "__main__":
    main()