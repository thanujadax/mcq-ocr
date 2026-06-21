import os
import pika
import json
import logging
################################ Configurations ###################
URL = os.getenv('RABBITMQ_URL', 'amqp://admin:secret@localhost:5673/')

loggger = logging.getLogger(__name__)

################################ Functions #######################
def send_message(queue: str, data: dict, routing_key: str = ''):
    outgoing_connection = pika.BlockingConnection(pika.URLParameters(URL))
    message = json.dumps(data)
    outgoing_channel = outgoing_connection.channel()
    outgoing_channel.queue_declare(queue=queue, durable=True)
    outgoing_channel.basic_publish(exchange='', routing_key=queue, body=message)
    outgoing_connection.close()

def start_consuming(queue: str, callback: callable):
    incoming_connection = pika.BlockingConnection(pika.URLParameters(URL))
    incoming_channel = incoming_connection.channel()
    incoming_channel.queue_declare(queue=queue,durable=True)
    incoming_channel.basic_consume(queue=queue, on_message_callback=callback, auto_ack=True)
    loggger.info(f" [*] Waiting for tasks in {queue}")
    incoming_channel.start_consuming()