from datetime import datetime, timezone, timedelta
from typing import Optional, Union, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from jose import JWTError, jwt
import logging

from app.database import get_async_db
from app.models.user import User, UserRoles, VerifyStatus
from app.schemas.auth import TokenResponse, TokenData, UserLogin, UserRegister
from app.schemas.user import UserResponse
from app.utils.security import verify_password, get_password_hash
from app.config import (
    get_secret_key, get_jwt_algorithm, get_access_token_expire_minutes,
    get_refresh_token_expire_days, get_super_user_email, get_super_user_password_hashed,
    get_cookie_secure, get_cookie_samesite, get_cookie_httponly
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

router = APIRouter(prefix="/api/auth", tags=["authentication"])
logger = logging.getLogger(__name__)


def get_token_from_cookie(request: Request) -> str:
    """Extract token from HttpOnly cookie."""
    logger.info("Extract token from HttpOnly cookie.")
    token = request.cookies.get("access_token")
    if not token:
        logger.error("Token not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Cookie"},
        )
    return token


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=get_access_token_expire_minutes())
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, get_secret_key(), algorithm=get_jwt_algorithm())
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT refresh token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=get_refresh_token_expire_days())
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, get_secret_key(), algorithm=get_jwt_algorithm())
    return encoded_jwt


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get user by email from database."""
    result = await db.execute(
        select(User).options(selectinload(User.faculty)).where(User.email == email)
    )
    return result.scalar_one_or_none()

async def authenticate_super_user(email: str, password: str) -> Optional[dict]:
    """Authenticate super user with email and password."""
    if email != get_super_user_email():
        return None
    if not verify_password(password, get_super_user_password_hashed()):
        return None
    
    # Return a mock user object for super user
    return {
        "id": 0,  # Special ID for super user
        "email": get_super_user_email(),
        "role": UserRoles.SUPERADMIN.value,
        "faculty_id": None,
        "first_name": "Super",
        "last_name": "Admin",
        "verify_status": VerifyStatus.ADMINVERIFIED.value
    }

async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """Authenticate user with email and password."""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_async_db)
) -> Union[User, Dict[str, Any]]:
    """Get current user from JWT token in cookie."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Cookie"},
    )
    
    try:
        token = get_token_from_cookie(request)
        payload = jwt.decode(token, get_secret_key(), algorithms=[get_jwt_algorithm()])
        email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
        faculty_id: int = payload.get("faculty_id")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise credentials_exception
            
        verify_status: str = payload.get("verify_status")
        
        token_data = TokenData(
            email=email,
            user_id=user_id,
            role=role,
            faculty_id=faculty_id
        )
    except JWTError:
        raise credentials_exception
    
    # Check if this is a super user token
    if user_id == 0 and email == get_super_user_email():
        # Return mock super user object
        return {
            "id": 0,
            "email": get_super_user_email(),
            "role": UserRoles.SUPERADMIN.value,
            "faculty_id": None,
            "first_name": "Super",
            "last_name": "Admin",
            "verify_status": VerifyStatus.ADMINVERIFIED.value
        }
    
    # Regular user - look up in database
    user = await get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(current_user: Union[User, Dict[str, Any]] = Depends(get_current_user)) -> Union[User, Dict[str, Any]]:
    """Get current active user (you can add additional checks here)."""
    # Add any additional user status checks here if needed
    return current_user


def get_user_id_from_token(request: Request) -> int:
    """Extract user_id from JWT token without database call."""
    try:
        token = get_token_from_cookie(request)
        payload = jwt.decode(token, get_secret_key(), algorithms=[get_jwt_algorithm()])
        user_id: int = payload.get("user_id")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Cookie"},
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Cookie"},
        )


def get_user_role_from_token(request: Request) -> str:
    """Extract user role from JWT token without database call."""
    try:
        token = get_token_from_cookie(request)
        payload = jwt.decode(token, get_secret_key(), algorithms=[get_jwt_algorithm()])
        role: str = payload.get("role")
        token_type: str = payload.get("type")
        
        if role is None or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Cookie"},
            )
        return role
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Cookie"},
        )


def get_user_verify_status_from_token(request: Request) -> str:
    """Extract user verify status from JWT token without database call."""
    try:
        token = get_token_from_cookie(request)
        payload = jwt.decode(token, get_secret_key(), algorithms=[get_jwt_algorithm()])
        verify_status: str = payload.get("verify_status")
        token_type: str = payload.get("type")
        
        if verify_status is None or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Cookie"},
            )
        return verify_status
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Cookie"},
        )


def get_user_from_token(request: Request) -> Dict[str, Any]:
    """Extract all user information from JWT token without database call."""
    try:
        token = get_token_from_cookie(request)
        payload = jwt.decode(token, get_secret_key(), algorithms=[get_jwt_algorithm()])
        
        user_id: int = payload.get("user_id")
        email: str = payload.get("sub")
        role: str = payload.get("role")
        faculty_id: Optional[int] = payload.get("faculty_id")
        verify_status: str = payload.get("verify_status")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Cookie"},
            )
            
        return {
            "id": user_id,
            "email": email,
            "role": role,
            "faculty_id": faculty_id,
            "verify_status": verify_status
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Cookie"},
        )

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_async_db)
):
    """Register a new user"""
    try:
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == user_data.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already exists")

        # Hash the password
        hashed_password = get_password_hash(user_data.password)

        new_user = User(
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            hashed_password=hashed_password,
            role=UserRoles.BASIC,
            faculty_id=user_data.faculty_id,
            last_login=None,
            verify_status=VerifyStatus.NONE
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        return UserResponse.model_validate(new_user)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to register user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to register user")


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_async_db)
):
    """Login endpoint that returns access and refresh tokens."""
    try:
        user = None
        is_super_user = False
        
        # Check if this is super user login
        if form_data.email == get_super_user_email():
            logger.info("Super User")
            super_user_data = await authenticate_super_user(form_data.email, form_data.password)
            if super_user_data:
                user = super_user_data
                is_super_user = True
        
        # If not super user or super user auth failed, try regular user
        if not user:
            db_user = await authenticate_user(db, form_data.email, form_data.password)
            if db_user:
                user = db_user
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Cookie"},
            )
        
        # Update last login for regular users only
        if not is_super_user:
            user.last_login = datetime.now(timezone.utc)
            await db.commit()
        
        # Create tokens
        access_token_expires = timedelta(minutes=get_access_token_expire_minutes())
        refresh_token_expires = timedelta(days=get_refresh_token_expire_days())
        
        # Prepare token data based on user type
        if is_super_user:
            token_data = {
                "sub": user["email"],
                "user_id": user["id"],
                "role": user["role"],
                "faculty_id": user["faculty_id"],
                "verify_status": VerifyStatus.ADMINVERIFIED.value
            }
        else:
            token_data = {
                "sub": user.email,
                "user_id": user.id,
                "role": user.role.value,
                "faculty_id": user.faculty_id,
                "verify_status": user.verify_status.value
            }
        
        access_token = create_access_token(
            data=token_data, 
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(
            data=token_data, 
            expires_delta=refresh_token_expires
        )

        # Set HttpOnly cookies for production security
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=get_cookie_httponly(),
            secure=get_cookie_secure(),
            samesite=get_cookie_samesite(),
            max_age=get_access_token_expire_minutes() * 60
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=get_cookie_httponly(),
            secure=get_cookie_secure(),
            samesite=get_cookie_samesite(),
            max_age=get_refresh_token_expire_days() * 24 * 60 * 60
        )
        
        return {
            "message": "Login successful"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_async_db)
):
    """Refresh access token using refresh token from cookie."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Cookie"},
    )
    
    try:
        # Get refresh token from cookie
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise credentials_exception
            
        payload = jwt.decode(refresh_token, get_secret_key(), algorithms=[get_jwt_algorithm()])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "refresh":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Get user_id from token to check if super user
    user_id = payload.get("user_id")
    is_super_user = False
    
    # Check if this is a super user refresh token
    if user_id == 0 and email == get_super_user_email():
        is_super_user = True
        user = {
            "id": 0,
            "email": get_super_user_email(),
            "role": UserRoles.SUPERADMIN.value,
            "faculty_id": None,
            "verify_status": VerifyStatus.ADMINVERIFIED.value
        }
    else:
        # Regular user - look up in database
        user = await get_user_by_email(db, email)
        if user is None:
            raise credentials_exception
    
    # Create new tokens
    access_token_expires = timedelta(minutes=get_access_token_expire_minutes())
    new_refresh_token_expires = timedelta(days=get_refresh_token_expire_days())
    
    # Prepare token data based on user type
    if is_super_user:
        token_data = {
            "sub": user["email"],
            "user_id": user["id"],
            "role": user["role"],
            "faculty_id": user["faculty_id"],
            "verify_status": user["verify_status"]
        }
    else:
        token_data = {
            "sub": user.email,
            "user_id": user.id,
            "role": user.role.value,
            "faculty_id": user.faculty_id,
            "verify_status": user.verify_status.value
        }
    
    new_access_token = create_access_token(
        data=token_data, 
        expires_delta=access_token_expires
    )
    new_refresh_token = create_refresh_token(
        data=token_data, 
        expires_delta=new_refresh_token_expires
    )

    # Set new HttpOnly cookies
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=get_cookie_httponly(),
        secure=get_cookie_secure(),
        samesite=get_cookie_samesite(),
        max_age=get_access_token_expire_minutes() * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=get_cookie_httponly(),
        secure=get_cookie_secure(),
        samesite=get_cookie_samesite(),
        max_age=get_refresh_token_expire_days() * 24 * 60 * 60
    )
    
    return {
        "message": "Token refreshed successfully"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Union[User, Dict[str, Any]] = Depends(get_current_active_user)
):
    """Get current user information."""
    # Handle super user
    if isinstance(current_user, dict):
        return UserResponse(
            id=current_user["id"],
            email=current_user["email"],
            first_name=current_user["first_name"],
            last_name=current_user["last_name"],
            role=UserRoles.SUPERADMIN.value,  # Use the enum value (string)
            verify_status=VerifyStatus.ADMINVERIFIED.value,  # Use the enum value (string)
            faculty_id=current_user["faculty_id"],  # This is None, which is now allowed
            last_login=None,  # Super user doesn't have login tracking
            created_at=None,  # Super user doesn't have these timestamps
            updated_at=None
        )

    # Handle regular user
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout(response: Response):
    """Logout endpoint that clears HttpOnly cookies."""
    # Clear the cookies by setting them to expire immediately
    response.set_cookie(
        key="access_token",
        value="",
        httponly=get_cookie_httponly(),
        secure=get_cookie_secure(),
        samesite=get_cookie_samesite(),
        max_age=0
    )
    response.set_cookie(
        key="refresh_token",
        value="",
        httponly=get_cookie_httponly(),
        secure=get_cookie_secure(),
        samesite=get_cookie_samesite(),
        max_age=0
    )
    return {"message": "Successfully logged out"}


@router.get("/websocket-token")
async def get_websocket_token(request: Request):
    """
    Generate a temporary token for WebSocket authentication.
    This endpoint is needed because HttpOnly cookies cannot be read by JavaScript,
    so we need an alternative way to authenticate WebSocket connections.
    """
    try:
        # Get user info from the HttpOnly cookie (server-side)
        user_info = get_user_from_token(request)
        
        # Create a short-lived token specifically for WebSocket use
        token_data = {
                "sub": user_info["email"],
                "user_id": user_info["id"],
                "role": user_info["role"],
                "faculty_id": user_info["faculty_id"],
                "verify_status": user_info["verify_status"],
            }
        
        # Create token with shorter expiration (5 minutes) for security
        websocket_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(minutes=5)
        )
        
        return {"websocket_token": websocket_token}
        
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to get WebSocket token"
        )
