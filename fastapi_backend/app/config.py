"""
Configuration management for MCQ OCR System.
"""

import logging
import sys
from pydantic import Field, ConfigDict, ValidationError
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class DatabaseSettings(BaseSettings):
    """Database configuration settings."""

    model_config = ConfigDict(extra="ignore")

    database_url: str = Field(
        ...,
        description="PostgreSQL database connection URL"
    )

    database_host: str = Field(...)
    database_port: int = Field(...)
    database_name: str = Field(...)
    database_user: str = Field(...)
    database_password: str = Field(...)
    
    # Database pool settings
    database_pool_size: int = Field(
        default=20)
    
    database_max_overflow: int = Field(
        default=30)
    
    database_pool_recycle: int = Field(
        default=300)
    
    database_echo: bool = Field(
        default=False)


class AppSettings(BaseSettings):
    """Application configuration settings."""
    
    model_config = ConfigDict(extra="ignore")
    
    app_name: str = Field(
        default="MCQ OCR System")
    
    app_version: str = Field(
        default="1.0.0")
    
    debug: bool = Field(
        default=False)
    
    environment: str = Field(
        default="production")
    
    # CORS settings
    allowed_hosts: str = Field(
        ...)
    
    # File upload settings
    max_upload_size: int = Field(
        default=100 * 1024 * 1024,  # 100MB
    )
    
    upload_dir: str = Field(
        default="uploads")
    
    # NFS/Shared storage settings
    nfs_shared_path: str = Field(
        default="/shared")


class RabbitMQSettings(BaseSettings):
    """RabbitMQ configuration settings."""

    model_config = ConfigDict(extra="ignore")

    rabbitmq_url: str = Field(...)
    rabbitmq_host: str = Field(...)
    rabbitmq_port: int = Field(...)
    rabbitmq_user: str = Field(...)
    rabbitmq_password: str = Field(...)


class AuthSettings(BaseSettings):
    """Authentication settings."""
    
    model_config = ConfigDict(extra="ignore")
    
    secret_key: str = Field(
        ...,
        description="Secret key for JWT token signing"
    )
    
    algorithm: str = Field(
        default="HS256",
        validation_alias="JWT_ALGORITHM",
        description="JWT signing algorithm"
    )
    
    access_token_expire_minutes: int = Field(
        default=30,
        description="Access token expiration time in minutes"
    )
    
    refresh_token_expire_days: int = Field(
        default=7,
        description="Refresh token expiration time in days"
    )
    
    # Super user settings
    super_user_email: str = Field(
        ...,
        description="Super user email"
    )

    super_user_password_hashed: str = Field(
        ...,
        validation_alias="SUPER_USER_PASSWORD",
        description="Super user hashed password (bcrypt)"
    )

    # Cookie settings
    cookie_secure: bool = Field(
        ...,
        description="Use secure cookies (HTTPS only)"
    )

    cookie_samesite: str = Field(
        ...,
        description="SameSite cookie policy"
    )

    cookie_httponly: bool = Field(
        ...,
        description="Use HttpOnly cookies"
    )


class Settings(BaseSettings):
    """Main settings class combining all configuration."""

    model_config = ConfigDict(extra="ignore")

    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    app: AppSettings = Field(default_factory=AppSettings)
    rabbitmq: RabbitMQSettings = Field(default_factory=RabbitMQSettings)
    auth: AuthSettings = Field(default_factory=AuthSettings)


try:
    settings = Settings()
except ValidationError as e:
    missing = [
        f"  - {err['loc'][-1]}" for err in e.errors() if err["type"] == "missing"
    ]
    logger.error(
        "Configuration failed to load. Missing required environment variables:\n%s",
        "\n".join(missing) if missing else str(e),
    )
    sys.exit(1)


def get_settings() -> Settings:
    """Get application settings."""
    return settings


# Database URL construction
def get_database_url() -> str:
    """Construct database URL from settings."""
    return (
        f"postgresql://{settings.database.database_user}:"
        f"{settings.database.database_password}@"
        f"{settings.database.database_host}:"
        f"{settings.database.database_port}/"
        f"{settings.database.database_name}"
    )


def get_async_database_url() -> str:
    """Construct async database URL from settings."""
    return (
        f"postgresql+asyncpg://{settings.database.database_user}:"
        f"{settings.database.database_password}@"
        f"{settings.database.database_host}:"
        f"{settings.database.database_port}/"
        f"{settings.database.database_name}"
    )

def get_super_user_creds() -> dict:
    """Return super user email and password"""
    return ({
        "email": settings.auth.super_user_email,
        "super_user_password_hashed": settings.auth.super_user_password_hashed
    })


# Utility functions for accessing specific settings without circular imports
def get_nfs_shared_path() -> str:
    """Get NFS shared path from settings."""
    return settings.app.nfs_shared_path


def get_rabbitmq_url() -> str:
    """Get RabbitMQ URL from settings."""
    return settings.rabbitmq.rabbitmq_url


def get_rabbitmq_host() -> str:
    """Get RabbitMQ host from settings."""
    return settings.rabbitmq.rabbitmq_host


def get_rabbitmq_port() -> int:
    """Get RabbitMQ port from settings."""
    return settings.rabbitmq.rabbitmq_port


def get_rabbitmq_user() -> str:
    """Get RabbitMQ user from settings."""
    return settings.rabbitmq.rabbitmq_user


def get_rabbitmq_password() -> str:
    """Get RabbitMQ password from settings."""
    return settings.rabbitmq.rabbitmq_password


def get_secret_key() -> str:
    """Get JWT secret key from settings."""
    return settings.auth.secret_key


def get_jwt_algorithm() -> str:
    """Get JWT algorithm from settings."""
    return settings.auth.algorithm


def get_access_token_expire_minutes() -> int:
    """Get access token expire minutes from settings."""
    return settings.auth.access_token_expire_minutes


def get_refresh_token_expire_days() -> int:
    """Get refresh token expire days from settings."""
    return settings.auth.refresh_token_expire_days


def get_super_user_email() -> str:
    """Get super user email from settings."""
    return settings.auth.super_user_email


def get_super_user_password_hashed() -> str:
    """Get super user password hashed from settings."""
    return settings.auth.super_user_password_hashed


def get_cookie_secure() -> bool:
    """Get cookie secure setting from settings."""
    return settings.auth.cookie_secure


def get_cookie_samesite() -> str:
    """Get cookie samesite setting from settings."""
    return settings.auth.cookie_samesite


def get_cookie_httponly() -> bool:
    """Get cookie httponly setting from settings."""
    return settings.auth.cookie_httponly


def get_app_name() -> str:
    """Get app name from settings."""
    return settings.app.app_name


def get_app_version() -> str:
    """Get app version from settings."""
    return settings.app.app_version


def get_debug() -> bool:
    """Get debug setting from settings."""
    return settings.app.debug


def get_environment() -> str:
    """Get environment from settings."""
    return settings.app.environment


def get_allowed_hosts() -> list:
    """Get allowed hosts from settings."""
    hosts_str = settings.app.allowed_hosts
    if hosts_str == "*":
        return ["*"]
    return [host.strip() for host in hosts_str.split(",")]


def get_max_upload_size() -> int:
    """Get max upload size from settings."""
    return settings.app.max_upload_size


def get_upload_dir() -> str:
    """Get upload directory from settings."""
    return settings.app.upload_dir


def get_database_echo() -> bool:
    """Get database echo setting from settings."""
    return settings.database.database_echo


def get_database_pool_recycle() -> int:
    """Get database pool recycle setting from settings."""
    return settings.database.database_pool_recycle


def get_database_pool_size() -> int:
    """Get database pool size setting from settings."""
    return settings.database.database_pool_size


def get_database_max_overflow() -> int:
    """Get database max overflow setting from settings."""
    return settings.database.database_max_overflow