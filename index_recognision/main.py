################################ Imports ##########################
import Detector
import Recognizer
import numpy as np
import cv2
import os,sys
import json
from task_queue.rabbitMQ import send_message, start_consuming

################################ Configurations ###################
INCOMING_QUEUE = os.getenv('RABBITMQ_INCOMING_QUEUE', 'rabbitmq_incoming_queue')
OUTGOING_QUEUE = os.getenv('RABBITMQ_OUTGOING_QUEUE', 'rabbitmq_outgoing_queue')

################################ Functions ##########################
def preprocess(file_path) -> np.ndarray:
    # Check if file exists
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    image = cv2.imread(file_path)
    return image

def postprocess(data):
    # Generate the flag based on confidence score
    if data['confidence'] < 0.8:
        data['flag'] = 'low_confidence'
    else:
        data['flag'] = 'ok'
    return data

def callback(ch, method, properties, body):
    print(" [x] Received task")
    task = json.loads(body)
    file_path = task['file_path']
    task_id = task['task_id']
    
    ## Detect the index section from the input image
    try:
        image = preprocess(file_path)
    except FileNotFoundError as e:
        print(e)
        return
    index_image = Detector.get_index_section(image)
    print(f"Index section extracted.")
    data = Recognizer.recognize_student_index(index_image)
    data = postprocess(data)
    print(f"data: {data}")

    ## Send the result to the outgoing queue
    result = {
        'file_path': file_path,
        'data': data,
        'task_id': task_id
    }
    send_message(OUTGOING_QUEUE, result)
    print(" [x] Task completed and result sent")

################################ Main Code ##########################
def main():
    start_consuming(INCOMING_QUEUE, callback)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted")
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)