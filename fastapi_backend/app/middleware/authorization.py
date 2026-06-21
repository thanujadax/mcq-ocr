from typing import List, Callable
from fastapi import Request, HTTPException, status
from functools import wraps
import logging

from app.models.user import UserRoles, VerifyStatus
from app.api.routes.auth import get_user_from_token
from app.middleware.user_state import UserState

logger = logging.getLogger(__name__)


class AuthorizationMiddleware:
    """
    Authorization middleware for role-based access control and verification status checking.
    """
    
    @staticmethod
    def require_roles(
        allowed_roles: List[UserRoles], 
        require_admin_verified: bool = True
    ):
        """
        Decorator to require specific user roles and verification status for endpoint access.
        
        Args:
            allowed_roles: List of UserRoles that are allowed to access the endpoint
            require_admin_verified: Whether the user must be admin verified (default: True)
        
        Returns:
            Decorator function that wraps the endpoint
        """
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Extract request from kwargs or args
                request = None
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
                
                if not request:
                    for key, value in kwargs.items():
                        if isinstance(value, Request):
                            request = value
                            break
                
                if not request:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Request object not found in middleware"
                    )
                
                # Check authorization
                await AuthorizationMiddleware._check_authorization(
                    request, allowed_roles, require_admin_verified
                )
                
                # Call the original function
                return await func(*args, **kwargs)
            
            return wrapper
        return decorator
    
    @staticmethod
    async def _check_authorization(
        request: Request,
        allowed_roles: List[UserRoles],
        require_admin_verified: bool = True
    ):
        """
        Internal method to check user authorization.
        
        Args:
            request: FastAPI Request object
            allowed_roles: List of allowed user roles
            require_admin_verified: Whether admin verification is required
        
        Raises:
            HTTPException: If user is not authorized
        """
        try:
            # Extract user information from token
            user_info = get_user_from_token(request)
            
           
            
            # Add user to request state for access in endpoints
            request.state.current_user = UserState(user_info)
            
            # Extract role and verification status
            user_role_str = user_info["role"]
            user_verify_status_str = user_info["verify_status"]
            
            # Convert string values to enums
            user_role = None
            user_verify_status = None
            
            # Find matching UserRole enum
            for role in UserRoles:
                if role.value == user_role_str:
                    user_role = role
                    break
            
            # Find matching VerifyStatus enum
            for status_enum in VerifyStatus:
                if status_enum.value == user_verify_status_str:
                    user_verify_status = status_enum
                    break
            
            if not user_role:
                logger.warning(f"Invalid user role in token: {user_role_str}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid user role",
                    headers={"WWW-Authenticate": "Cookie"},
                )
            
            if not user_verify_status:
                logger.warning(f"Invalid verification status in token: {user_verify_status_str}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid verification status",
                    headers={"WWW-Authenticate": "Cookie"},
                )
            
            # Check if user role is in allowed roles
            if user_role not in allowed_roles:
                logger.warning(
                    f"User with role {user_role.value} attempted to access endpoint requiring {[role.value for role in allowed_roles]}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {[role.value for role in allowed_roles]}",
                )
            
            # Check verification status if required
            if require_admin_verified and user_verify_status != VerifyStatus.ADMINVERIFIED:
                logger.warning(
                    f"User with verification status {user_verify_status.value} attempted to access endpoint requiring admin verification"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. Admin verification for the user account required.",
                )
            
            logger.info(
                f"Authorization successful: role={user_role.value}, "
                f"verification={user_verify_status.value}, "
                f"allowed_roles={[role.value for role in allowed_roles]}"
            )
            
        except HTTPException:
            # Re-raise HTTP exceptions (authentication/authorization errors)
            raise
        except Exception as e:
            logger.error(f"Authorization check failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authorization check failed"
            )


# Convenience functions for common role combinations
def require_superadmin(require_admin_verified: bool = True):
    """Require SUPERADMIN role"""
    return AuthorizationMiddleware.require_roles([UserRoles.SUPERADMIN], require_admin_verified)


def require_faculty_admin_or_higher(require_admin_verified: bool = True):
    """Require FACULTYADMIN or SUPERADMIN role"""
    return AuthorizationMiddleware.require_roles(
        [UserRoles.FACULTYADMIN, UserRoles.SUPERADMIN], 
        require_admin_verified
    )


def require_any_verified_user(require_admin_verified: bool = True):
    """Require any user role (BASIC, FACULTYADMIN, or SUPERADMIN)"""
    return AuthorizationMiddleware.require_roles(
        [UserRoles.BASIC, UserRoles.FACULTYADMIN, UserRoles.SUPERADMIN], 
        require_admin_verified
    )


def require_basic_or_higher(require_admin_verified: bool = True):
    """Require BASIC or higher role (essentially any authenticated user)"""
    return AuthorizationMiddleware.require_roles(
        [UserRoles.BASIC, UserRoles.FACULTYADMIN, UserRoles.SUPERADMIN], 
        require_admin_verified
    )


def require_non_super_admin(require_admin_verified: bool = True):
    """Require BASIC or FACULTYADMIN roles (excludes SUPERADMIN)"""
    return AuthorizationMiddleware.require_roles(
        [UserRoles.BASIC, UserRoles.FACULTYADMIN], 
        require_admin_verified
    )


# Dependency function for FastAPI Depends usage
async def verify_authorization(
    request: Request,
    allowed_roles: List[UserRoles] = [UserRoles.BASIC, UserRoles.FACULTYADMIN, UserRoles.SUPERADMIN],
    require_admin_verified: bool = True
):
    """
    FastAPI dependency function for authorization checking.
    
    Usage:
        @router.get("/endpoint")
        async def my_endpoint(
            auth_check = Depends(lambda req: verify_authorization(
                req, 
                [UserRoles.FACULTYADMIN, UserRoles.SUPERADMIN], 
                True
            ))
        ):
            pass
    """
    await AuthorizationMiddleware._check_authorization(
        request, allowed_roles, require_admin_verified
    )
    return True