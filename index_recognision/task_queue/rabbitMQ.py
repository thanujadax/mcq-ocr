import os
import pika
import json
################################ Configurations ###################
URL = os.getenv('RABBITMQ_URL', 'amqp://admin:secret@localhost:5672/')



################################ Functions #######################
def send_message(queue: str, data: dict, routing_key: str = ''):
    outgoing_connection = pika.BlockingConnection(pika.URLParameters(URL))
    message = json.dumps(data)
    outgoing_channel = outgoing_connection.channel()
    outgoing_channel.queue_declare(queue=queue)
    outgoing_channel.basic_publish(exchange='', routing_key=queue, body=message)
    outgoing_connection.close()

def start_consuming(queue: str, callback: callable):
    incoming_connection = pika.BlockingConnection(pika.URLParameters(URL))
    incoming_channel = incoming_connection.channel()
    incoming_channel.queue_declare(queue=queue)
    incoming_channel.basic_consume(queue=queue, on_message_callback=callback, auto_ack=True)
    print(f" [*] Waiting for tasks in {queue}",flush=True)
    incoming_channel.start_consuming()