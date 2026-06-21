import pika
import logging
import threading
import json
from app.utils.EventRegistery import EventRegistery
from app.utils.ThreadSafeDict import ThreadSafeDict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IndexListner:
    def __init__(self, rabbitmq_url: str, event_registery: EventRegistery, temp_data_store: ThreadSafeDict, queue_name: str = 'index_results_queue'):
        self.rabbitmq_url = rabbitmq_url
        self.event_registery = event_registery
        self.temp_data_store = temp_data_store
        self.queue_name = queue_name
        self.thread = None
        self.should_stop = threading.Event()

    def start(self):
        logger.info("Starting IndexListner...")
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
    
    def _run(self):
        """Run in the worker thread - create connection here"""
        try:
            # Create connection and channel IN THIS THREAD
            connection = pika.BlockingConnection(pika.URLParameters(self.rabbitmq_url))
            channel = connection.channel()
            channel.queue_declare(queue=self.queue_name, durable=True)
            
            # Set up consumer
            channel.basic_consume(
                queue=self.queue_name, 
                on_message_callback=self.on_message, 
                auto_ack=True
            )
            
            logger.info(f"Started consuming messages from {self.queue_name}")
            
            # Start consuming (blocking call)
            channel.start_consuming()
            
        except Exception as e:
            logger.error(f"Error in IndexListner thread: {e}")
        finally:
            try:
                if 'connection' in locals() and connection.is_open:
                    connection.close()
            except:
                pass
    
    def stop(self):
        """Graceful shutdown"""
        logger.info("Stopping IndexListner...")
        self.should_stop.set()
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
    
    def on_message(self, ch, method, properties, body):
        try:
            message = body.decode('utf-8')
            task = json.loads(message)
            task_id = task.get('task_id')
            
            if task_id is None:
                logger.error("Received message without task_id")
                return
            
            logger.info(f"Received index recognition result for task_id: {task_id}")
            logger.info(f"Message content: {message}")
            
            # Store in thread-safe dict
            self.temp_data_store.set(task_id, task)
            
            # Trigger event
            self.event_registery.set_event(task_id)
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")