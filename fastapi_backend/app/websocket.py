from fastapi import WebSocket
from enum import Enum
from starlette.websockets import WebSocketState
import logging

logger = logging.getLogger(__name__)

class WebSocketConnectionType(Enum):
    TEMPLATE_CONFIG = "template_config"
    MARKING_SCHEME_CONFIG = "marking_scheme_config"
    MARKING_JOB = "marking_job"

class WebSocketManager:
    def __init__(self):
        self.template_config_connections: dict[str, list[WebSocket]] = {}
        self.marking_scheme_config_connections: dict[str, list[WebSocket]] = {}
        self.marking_job_connections: dict[str, list[WebSocket]] = {}

    async def _connect(self, connections: dict, job_id: str, websocket: WebSocket):
        await websocket.accept()
        if job_id not in connections:
            connections[job_id] = []
        connections[job_id].append(websocket)
        await self._send_message(connections, job_id, {"status": "connected"})

    async def _register(self, connections: dict, job_id: str, websocket: WebSocket):
        """Register a websocket without accepting it (already accepted)"""
        if job_id not in connections:
            connections[job_id] = []
        connections[job_id].append(websocket)

    async def _disconnect(self, connections: dict, job_id: str, websocket: WebSocket):
        if job_id in connections.keys() and websocket in connections[job_id]:
            connections[job_id].remove(websocket)
        # Only close if not already closed
        if websocket.client_state != WebSocketState.DISCONNECTED:
            try:
                await websocket.close()
            except Exception:
                pass  # Already closed or closing

    async def _clean_connections(self, connections: dict, job_id: str):
        if job_id in connections.keys():
            if len(connections[job_id]) == 0:
                for connection in connections[job_id]:
                    await connection.close()
                del connections[job_id]
    
    async def _send_message(self, connections: dict, job_id: str, message: dict):
        logger.info(f"Attempting to send message to {job_id}, connections available: {list(connections.keys())}")
        if job_id in connections:
            logger.info(f"Found {len(connections[job_id])} connections for job {job_id}")
            # Create a copy of the list to avoid modification during iteration
            connections_to_send = connections[job_id].copy()
            for connection in connections_to_send:
                try:
                    # Check if connection is still open
                    if connection.client_state == WebSocketState.CONNECTED:
                        logger.info(f"Sending message to connection for job {job_id}")
                        await connection.send_json(message)
                        logger.info(f"Successfully sent message to connection for job {job_id}")
                    else:
                        logger.warning(f"Connection for job {job_id} is not connected, state: {connection.client_state}")
                        # Remove closed connections
                        if connection in connections[job_id]:
                            connections[job_id].remove(connection)
                except Exception as e:
                    # Remove failed connections
                    if connection in connections[job_id]:
                        connections[job_id].remove(connection)
                    logger.warning(f"Failed to send WebSocket message to {job_id}: {e}")
        else:
            logger.warning(f"No connections found for job {job_id}")

    async def connect_template_config(self, job_id: str, websocket: WebSocket):
        await self._connect(self.template_config_connections, job_id, websocket)

    async def send_message_to_template_config(self, job_id: str, message: dict):
        await self._send_message(self.template_config_connections, job_id, message)

    async def disconnect_template_config(self, job_id: str, websocket: WebSocket):
        await self._disconnect(self.template_config_connections, job_id, websocket)

    async def clean_template_config_connections(self, job_id: str):
        await self._clean_connections(self.template_config_connections, job_id)

    async def connect_marking_scheme_config(self, job_id: str, websocket: WebSocket):
        await self._connect(self.marking_scheme_config_connections, job_id, websocket)

    async def register_marking_scheme_config(self, job_id: str, websocket: WebSocket):
        """Register a marking scheme config websocket that's already been accepted"""
        logger.info(f"Registering marking scheme config WebSocket for job {job_id}")
        await self._register(self.marking_scheme_config_connections, job_id, websocket)
        logger.info(f"Registered marking scheme config WebSocket for job {job_id}, total connections: {len(self.marking_scheme_config_connections.get(job_id, []))}")

    async def disconnect_marking_scheme_config(self, job_id: str, websocket: WebSocket):
        await self._disconnect(self.marking_scheme_config_connections, job_id, websocket)

    async def clean_marking_scheme_config_connections(self, job_id: str):
        await self._clean_connections(self.marking_scheme_config_connections, job_id)

    async def send_message_to_marking_scheme_config(self, job_id: str, message: dict):
        await self._send_message(self.marking_scheme_config_connections, job_id, message)

    async def connect_marking_job(self, job_id: str, websocket: WebSocket):
        await self._connect(self.marking_job_connections, job_id, websocket)

    async def register_marking_job(self, job_id: str, websocket: WebSocket):
        """Register a marking job websocket that's already been accepted"""
        await self._register(self.marking_job_connections, job_id, websocket)

    async def send_message_to_marking_job(self, job_id: str, message: dict):
        await self._send_message(self.marking_job_connections, job_id, message)

    async def disconnect_marking_job(self, job_id: str, websocket: WebSocket):
        await self._disconnect(self.marking_job_connections, job_id, websocket)

    async def clean_marking_job_connections(self, job_id: str):
        await self._clean_connections(self.marking_job_connections, job_id)