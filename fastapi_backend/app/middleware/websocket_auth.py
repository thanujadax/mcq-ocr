"""
Simple WebSocket authorization that works like HTTP middleware.
Only authorizes during handshake using existing auth functions.
"""

import logging
from typing import List, Dict, Any
from fastapi import WebSocket, HTTPException, status
from starlette.websockets import WebSocketDisconnect

from app.models.user import UserRoles, VerifyStatus
from app.api.routes.auth import get_user_from_token
from app.middleware.user_state import UserState

logger = logging.getLogger(__name__)


class MockRequest:
    """Mock request object to reuse existing get_user_from_token function."""
    
    def __init__(self, websocket: WebSocket):
        self.cookies = {}
        
        # First, try to get token from query parameters (for WSS connections where cookies may not work)
        query_params = dict(websocket.query_params)
        if "token" in query_params:
            logger.info("Found token in WebSocket query parameters")
            self.cookies["access_token"] = query_params["token"]
        
        # Then try to get token from headers (for cases where cookies are sent)
        headers = dict(websocket.headers)
        cookie_header = headers.get("cookie", "")
        if cookie_header:
            # Parse cookies from header
            for cookie in cookie_header.split(";"):
                cookie = cookie.strip()
                if "=" in cookie:
                    name, value = cookie.split("=", 1)
                    if name.strip() == "access_token":
                        self.cookies["access_token"] = value.strip()
                        logger.info("Found access_token in WebSocket cookie header")
                        break
        
        # Check if we have the access_token
        if "access_token" not in self.cookies:
            logger.warning("No access_token found in WebSocket headers or query parameters")
        else:
            logger.info(f"Found access_token with length: {len(self.cookies['access_token'])}")


async def authorize_websocket(
    websocket: WebSocket,
    allowed_roles: List[UserRoles] = None,
    require_admin_verified: bool = True
) -> UserState:
    """
    Authorize WebSocket connection after it has been accepted.
    
    Args:
        websocket: WebSocket connection (must be already accepted)
        allowed_roles: List of allowed user roles (defaults to non-super admin)
        require_admin_verified: Whether admin verification is required
        
    Returns:
        UserState: Authorized user state
        
    Raises:
        WebSocketDisconnect: If authorization fails
    """
    if allowed_roles is None:
        logger.warning(f"WebSocket authorization failed: No roles are valid")
        await websocket.close(code=1008, reason="No roles are valid")
        raise WebSocketDisconnect(code=1008, reason="No roles are valid")
    
    try:
        # Create mock request to reuse existing auth logic
        mock_request = MockRequest(websocket)
        
        # Use existing get_user_from_token function
        logger.info("Attempting to get user from token...")
        user_info = get_user_from_token(mock_request)
        logger.info(f"Successfully got user info: {user_info}")
        
        # Create user state
        user_state = UserState(user_info)
        
        # Extract role and verification status
        user_role_str = user_info["role"]
        user_verify_status_str = user_info["verify_status"]
        
        logger.info(f"User role: {user_role_str}, Verification status: {user_verify_status_str}")
        
        # Convert string values to enums
        user_role = None
        user_verify_status = None
        
        # Find matching UserRole and VerifyStatus enums efficiently
        try:
            user_role = UserRoles(user_role_str)
        except ValueError:
            user_role = None
            
        try:
            user_verify_status = VerifyStatus(user_verify_status_str)
        except ValueError:
            user_verify_status = None
        
        if not user_role:
            logger.error(f"Invalid user role in WebSocket token: '{user_role_str}' (type: {type(user_role_str)})")
            await websocket.close(code=1008, reason="Invalid user role")
            raise WebSocketDisconnect(code=1008, reason="Invalid user role")
        
        if not user_verify_status:
            logger.error(f"Invalid verification status in WebSocket token: '{user_verify_status_str}' (type: {type(user_verify_status_str)})")
            await websocket.close(code=1008, reason="Invalid verification status")
            raise WebSocketDisconnect(code=1008, reason="Invalid verification status")
        
        # Check if user role is in allowed roles
        if user_role not in allowed_roles:
            logger.warning(
                f"WebSocket user with role {user_role.value} attempted to access endpoint requiring {[role.value for role in allowed_roles]}"
            )
            await websocket.close(code=1008, reason="Access denied: insufficient role")
            raise WebSocketDisconnect(code=1008, reason="Access denied: insufficient role")
        
        # Check verification status if required
        if require_admin_verified and user_verify_status != VerifyStatus.ADMINVERIFIED:
            logger.warning(
                f"WebSocket user with verification status {user_verify_status.value} attempted to access endpoint requiring admin verification"
            )
            await websocket.close(code=1008, reason="Access denied: admin verification required")
            raise WebSocketDisconnect(code=1008, reason="Access denied: admin verification required")
        
        logger.info(
            f"WebSocket authorization successful: role={user_role.value}, "
            f"verification={user_verify_status.value}"
        )
        
        return user_state
        
    except HTTPException as e:
        # Convert HTTP exception to WebSocket disconnect
        logger.warning(f"WebSocket authorization failed: {e.detail}")
        await websocket.close(code=1008, reason=e.detail)
        raise WebSocketDisconnect(code=1008, reason=e.detail)
    
    except Exception as e:
        logger.error(f"WebSocket authorization error: {str(e)}")
        await websocket.close(code=1008, reason="Authorization failed")
        raise WebSocketDisconnect(code=1008, reason="Authorization failed")