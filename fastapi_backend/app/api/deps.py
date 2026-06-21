"""
Dependency injection for FastAPI routes.
"""

from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_async_db
from ..config import get_settings
from ..websocket import WebSocketManager
import logging

logger = logging.getLogger(__name__)

# Simple singleton - works fine with single worker process
_websocket_manager_instance: WebSocketManager = None

# Settings dependency
def get_app_settings():
    """Get application settings."""
    return get_settings()

# Database dependency
async def get_database_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session dependency."""
    async for session in get_async_db():
        yield session

# WebSocket dependency - simple singleton
def get_websocket_manager() -> WebSocketManager:
    """Get the global singleton WebSocketManager instance."""
    global _websocket_manager_instance
    
    if _websocket_manager_instance is None:
        _websocket_manager_instance = WebSocketManager()
        logger.info(f"WebSocket manager created: {id(_websocket_manager_instance)}")
    
    return _websocket_manager_instance

def initialize_websocket_manager() -> WebSocketManager:
    """Initialize the WebSocket manager singleton."""
    return get_websocket_manager()

# You can add more dependencies here as needed, for example:
# - Authentication dependencies
# - Authorization dependencies  
# - Rate limiting dependencies
# - Logging dependencies