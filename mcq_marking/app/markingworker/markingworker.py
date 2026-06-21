import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Union
import pika
from pika.adapters.blocking_connection import BlockingChannel
from pika.spec import Basic, BasicProperties

from app.markingworker.processors.job_processor_interface import JobProcessorInterface
from app.markingworker.processors.template_config_processor import TemplateConfigProcessor
from app.markingworker.processors.marking_scheme_config_processor import MarkingSchemeConfigProcessor
from app.markingworker.processors.marking_job_processor import MarkingJobProcessor


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MCQMarkingWorker:
    def __init__(
        self, 
        rabbitmq_url: str, 
        template_config_queue: str, 
        marking_job_queue: str, 
        marking_scheme_config_queue: str, 
        marking_job_results_queue: str, 
        template_config_results_queue: str, 
        marking_scheme_config_results_queue: str,
        event_registery: Any = None,
        temp_data_store: Any = None
    ) -> None:
        self.rabbitmq_url: str = rabbitmq_url
        self.template_config_queue: str = template_config_queue
        self.marking_job_queue: str = marking_job_queue
        self.marking_scheme_config_queue: str = marking_scheme_config_queue
        self.marking_job_results_queue: str = marking_job_results_queue
        self.template_config_results_queue: str = template_config_results_queue
        self.marking_scheme_config_results_queue: str = marking_scheme_config_results_queue
        self.connection: Optional[pika.BlockingConnection] = None
        self.channel: Optional[BlockingChannel] = None
        self.event_registery = event_registery
        self.temp_data_store = temp_data_store
        
    def connect(self) -> None:
        """Establish connection to RabbitMQ"""
        try:
            self.connection = pika.BlockingConnection(pika.URLParameters(self.rabbitmq_url))
            self.channel = self.connection.channel()
            
            # Declare queues
            self.channel.queue_declare(queue=self.template_config_queue, durable=True)
            self.channel.queue_declare(queue=self.marking_job_queue, durable=True)
            self.channel.queue_declare(queue=self.marking_scheme_config_queue, durable=True)
            
            logger.info("Connected to RabbitMQ")
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    def _publish_result(
        self, 
        ch: BlockingChannel, 
        properties: Optional[BasicProperties], 
        queue: str, 
        reply_data: Dict[str, Any]
    ) -> None:
        """Generic method to publish results to any queue"""
        ch.basic_publish(
            exchange='',
            routing_key=queue,
            body=json.dumps(reply_data),
            properties=pika.BasicProperties(
                content_type='application/json',
                correlation_id=properties.correlation_id if properties else None
            )
        )

    def _create_reply_data(
        self, 
        job_id: Union[int, str], 
        status: str, 
        result: Union[Dict[str, Any], str, bool]
    ) -> Dict[str, Any]:
        """Generic method to create reply data structure"""
        return {
            'job_id': job_id,
            'status': status,
            'result': result,
            'timestamp': datetime.now().isoformat()
        }

    def _send_progress_to_backend(
        self, 
        ch: BlockingChannel, 
        properties: Optional[BasicProperties], 
        job_id: Union[int, str], 
        completed: int, 
        total: int,
        queue: str
    ) -> None:
        """Send progress to backend"""
        reply_data = self._create_reply_data(job_id, 'processing', {
            'completed': completed,
            'total': total
        })
        self._publish_result(ch, properties, queue, reply_data)

    def process_job_with_error_handling(
        self, 
        ch: BlockingChannel, 
        method: Basic.Deliver, 
        properties: BasicProperties, 
        body: bytes, 
        reply_queue: str, 
        processor: JobProcessorInterface
    ) -> None:
        """
        Generic method to process jobs with error handling using a processor object.
        
        Args:
            ch: RabbitMQ channel
            method: Delivery method
            properties: Message properties
            body: Message body
            reply_queue: Queue to send results to
            processor: Job processor object implementing JobProcessorInterface
        """
        try:
            job_data: Dict[str, Any] = json.loads(body)
            job_id = processor.job_id
            job_type = processor.__class__.__name__.replace('Processor', '')
            
            # Validate job ID
            if job_id == 'unknown':
                reply_data = self._create_reply_data('unknown', 'failed', 'Job ID is unknown')
                self._publish_result(ch, properties, reply_queue, reply_data)
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
                logger.error(f"{job_type} Job ID is unknown")
                return
            
            logger.info(f"Processing {job_type} job: {job_id}")
            
            
            # Validate the job data
            if not processor.validate():
                reply_data = self._create_reply_data(job_id, 'failed', 'Job validation failed')
                self._publish_result(ch, properties, reply_queue, reply_data)
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
                logger.error(f"{job_type} job validation failed: {job_id}")
                return
            
            # Execute the job-specific processing using the processor
            result = processor.process()

            if result is False:
                reply_data = self._create_reply_data(job_id, 'failed', 'Job processing failed')
                self._publish_result(ch, properties, reply_queue, reply_data)
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
                logger.error(f"{job_type} job failed: {job_id}")
                return
            
            logger.info(f"{job_type} job completed: {job_id}")
            
            reply_data = self._create_reply_data(job_id, 'completed', result)
            self._publish_result(ch, properties, reply_queue, reply_data)
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Error processing job: {e}")
            job_id = processor.job_id if 'processor' in locals() else 'unknown'
            reply_data = self._create_reply_data(job_id, 'failed', str(e))
            self._publish_result(ch, properties, reply_queue, reply_data)
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    
    def process_template_config_job(
        self, 
        ch: BlockingChannel, 
        method: Basic.Deliver, 
        properties: BasicProperties, 
        body: bytes
    ) -> None:
        """Process template configuration job from RabbitMQ"""
        job_data: Dict[str, Any] = json.loads(body)
        processor = TemplateConfigProcessor(job_data, progress_callback=None)
        self.process_job_with_error_handling(
            ch, method, properties, body,
            self.template_config_results_queue,
            processor
        )

    def process_marking_scheme_config_job(
        self, 
        ch: BlockingChannel, 
        method: Basic.Deliver, 
        properties: BasicProperties, 
        body: bytes
    ) -> None:
        """Process marking scheme configuration job from RabbitMQ"""
        job_data: Dict[str, Any] = json.loads(body)
        processor = MarkingSchemeConfigProcessor(job_data, progress_callback=None)
        self.process_job_with_error_handling(
            ch, method, properties, body,
            self.marking_scheme_config_results_queue,
            processor
        )
    

    def process_marking_job(
        self, 
        ch: BlockingChannel, 
        method: Basic.Deliver, 
        properties: BasicProperties, 
        body: bytes
    ) -> None:
        """Process marking job from RabbitMQ"""
        job_data: Dict[str, Any] = json.loads(body)

        def progress_callback(completed: int, total:int):
            job_id = job_data.get('id', 'unknown')
            self._send_progress_to_backend(ch, properties, job_id, completed, total, self.marking_job_results_queue)
            
        processor = MarkingJobProcessor(job_data, progress_callback=progress_callback, rabbitmq_url=self.rabbitmq_url, event_registery=self.event_registery, temp_data_store=self.temp_data_store)
        self.process_job_with_error_handling(
            ch, method, properties, body,
            self.marking_job_results_queue,
            processor
        )
    
    def start_consuming(self) -> None:
        """Start consuming messages from RabbitMQ queues"""
        try:
            if not self.channel:
                raise RuntimeError("Channel not initialized. Call connect() first.")
            
            # Set up consumers
            self.channel.basic_qos(prefetch_count=1)  # Process one message at a time
            
            # Consumer for template config jobs
            self.channel.basic_consume(
                queue=self.template_config_queue,
                on_message_callback=self.process_template_config_job
            )
            
            # Consumer for marking config jobs
            self.channel.basic_consume(
                queue=self.marking_scheme_config_queue,
                on_message_callback=self.process_marking_scheme_config_job
            )
            
            # Consumer for marking jobs
            self.channel.basic_consume(
                queue=self.marking_job_queue,
                on_message_callback=self.process_marking_job
            )
            
            logger.info("Starting to consume messages. Press CTRL+C to stop.")
            self.channel.start_consuming()
            
        except KeyboardInterrupt:
            logger.info("Stopping consumer...")
            if self.channel:
                self.channel.stop_consuming()
            if self.connection:
                self.connection.close()
        except Exception as e:
            logger.error(f"Error in consumer: {e}")
            raise
    
    def run(self) -> None:
        """Main run method"""
        self.connect()
        self.start_consuming()