# Project Title

## Description
A brief description of your project.

## Environment Setup

The following environment variables must be configured for the MCQ Index Marking subsystem to function correctly:

- **RABBITMQ_HOST**  
  The hostname or IP address of the RabbitMQ server.  
  This tells the services where to connect to send or receive messages.

- **RABBITMQ_PORT**  
  The port number of the RabbitMQ server (default is usually `5672`).  
  This specifies the network port to use when connecting to RabbitMQ.

- **RABBITMQ_INCOMING_QUEUE**  
  The name of the queue where tasks are sent **to** the Index Number Detection subsystem.  
  The Cropper or central marking system will publish messages containing file paths and task metadata into this queue.

- **RABBITMQ_OUTGOING_QUEUE**  
  The name of the queue where results are sent **from** the Index Number Detection subsystem.  
  After processing, the service will publish the recognized index numbers and any associated metadata into this queue for consumption by other parts of the marking system.
