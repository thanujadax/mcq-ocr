################################ Imports ##########################
import cv2
import os,sys
import json
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout  # ← Use stream parameter instead of handlers
)
logging.getLogger("pika").setLevel(logging.WARNING)
import Detector
import Recognizer
import numpy as np
from task_queue.rabbitMQ import send_message, start_consuming
from storage.nfs_storage import NFSStorage

################################ Configurations ###################
INCOMING_QUEUE = os.getenv('RABBITMQ_INCOMING_QUEUE', 'rabbitmq_incoming_queue')
OUTGOING_QUEUE = os.getenv('RABBITMQ_OUTGOING_QUEUE', 'rabbitmq_outgoing_queue')
nfs = NFSStorage()
logger = logging.getLogger(__name__)

################################ Functions ##########################
def preprocess(file_path) -> np.ndarray:
    absolute_path = nfs.get_absolute_path(file_path)
    if not nfs.file_exists(absolute_path):
        raise FileNotFoundError(f"File not found: {absolute_path}")
    image = cv2.imread(absolute_path)
    return image

def callback(ch, method, properties, body):
    logger.info(" [x] Received %r" % body)
    task = json.loads(body) # type: dict
    file_path = task['file_path']
    result = task
    result['error_flag'] = False

    ## Detect the index section from the input image
    try:
        image = preprocess(file_path)
    except FileNotFoundError as e:
        logger.error(e)
        result['error_flag'] = True
        send_message(OUTGOING_QUEUE, result)
        logger.info(" [x] Sent result to outgoing queue")
        return
    try:
        index_image = Detector.get_index_section(image)
        logger.info(" [x] Index section detected")
        data = Recognizer.recognize_student_index(index_image)
        logger.info(" [x] Index recognized")
    except Exception as e:
        logger.error(f"Error during detection/recognition: {e}")
        result['error_flag'] = True
        send_message(OUTGOING_QUEUE, result)
        return

    ## Make result with incoming task + data
    result.update(data)
    send_message(OUTGOING_QUEUE, result)
    logger.info(" [x] Sent result to outgoing queue")

################################ Main Code ##########################
def main():
    logger.info("Waiting for tasks...")
    start_consuming(INCOMING_QUEUE, callback)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Interrupted")
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)