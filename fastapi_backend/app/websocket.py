from fastapi import WebSocket
from enum import Enum

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

    async def _disconnect(self, connections: dict, job_id: str, websocket: WebSocket):
        if job_id in connections.keys() and websocket in connections[job_id]:
            connections[job_id].remove(websocket)
        await websocket.close()

    async def _clean_connections(self, connections: dict, job_id: str):
        if job_id in connections.keys():
            if len(connections[job_id]) == 0:
                for connection in connections[job_id]:
                    await connection.close()
                del connections[job_id]
    
    async def _send_message(self, connections: dict, job_id: str, message: dict):
        if job_id in connections:
            for connection in connections[job_id]:
                await connection.send_json(message)

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

    async def disconnect_marking_scheme_config(self, job_id: str, websocket: WebSocket):
        await self._disconnect(self.marking_scheme_config_connections, job_id, websocket)

    async def clean_marking_scheme_config_connections(self, job_id: str):
        await self._clean_connections(self.marking_scheme_config_connections, job_id)

    async def send_message_to_marking_scheme_config(self, job_id: str, message: dict):
        await self._send_message(self.marking_scheme_config_connections, job_id, message)

    async def connect_marking_job(self, job_id: str, websocket: WebSocket):
        await self._connect(self.marking_job_connections, job_id, websocket)

    async def send_message_to_marking_job(self, job_id: str, message: dict):
        await self._send_message(self.marking_job_connections, job_id, message)

    async def disconnect_marking_job(self, job_id: str, websocket: WebSocket):
        await self._disconnect(self.marking_job_connections, job_id, websocket)

    async def clean_marking_job_connections(self, job_id: str):
        await self._clean_connections(self.marking_job_connections, job_id)

    async def send_message_to_marking_job(self, job_id: str, message: dict):
        await self._send_message(self.marking_job_connections, job_id, message)