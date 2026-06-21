"""
Database configuration and connection module for MCQ OCR System.
"""

import logging
from typing import AsyncGenerator
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import get_database_url, get_database_echo, get_database_pool_recycle, get_database_pool_size, get_database_max_overflow

logger = logging.getLogger(__name__)

DATABASE_URL = get_database_url()
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=get_database_echo(),
    future=True,
    pool_pre_ping=True,
    pool_recycle=get_database_pool_recycle(),
    pool_size=get_database_pool_size(),
    max_overflow=get_database_max_overflow(),
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create synchronous engine for migrations and other sync operations
sync_engine = create_engine(
    DATABASE_URL,
    echo=get_database_echo(),
    future=True,
    pool_pre_ping=True,
    pool_recycle=get_database_pool_recycle(),
    pool_size=get_database_pool_size(),
    max_overflow=get_database_max_overflow(),
)

# Create synchronous session factory
SessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)

# Base class for SQLAlchemy models
Base = declarative_base()


# Dependency to get async database session
async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get async database session.
    Use this as a dependency in your FastAPI endpoints.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Function to get sync database session (for migrations, etc.)
def get_sync_db():
    """
    Function to get synchronous database session.
    Use this for migrations and other synchronous operations.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Database connection test
async def test_database_connection():
    """
    Test database connection asynchronously.
    """
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            logger.info("Database connection successful")
            return True
    except Exception as e:
        logger.error("Database connection failed: %s", e)
        return False


def test_sync_database_connection():
    """
    Test database connection synchronously.
    """
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
            logger.info("Sync database connection successful")
            return True
    except Exception as e:
        logger.error("Sync database connection failed: %s", e)
        return False


# Create all tables
async def create_tables():
    """
    Create all database tables asynchronously.
    """
    # Import models to ensure they are registered with Base
    from .models import User, Template, FileOrFolder, MarkingJob, TemplateConfigJob
    
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def create_tables_sync():
    """
    Create all database tables synchronously.
    """
    # Import models to ensure they are registered with Base
    from .models import User, Template, FileOrFolder, MarkingJob, TemplateConfigJob
    
    Base.metadata.create_all(bind=sync_engine)


# Database initialization
async def init_db():
    """
    Initialize database - create tables and run any startup tasks.
    """
    logger.info("Initializing database")

    if not await test_database_connection():
        raise Exception("Failed to connect to database")

    await create_tables()

    logger.info("Database initialized successfully")


# Cleanup function
async def close_db():
    """
    Close database connections.
    """
    await async_engine.dispose()
    sync_engine.dispose()
    logger.info("Database connections closed")
