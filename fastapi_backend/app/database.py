"""
Database configuration and connection module for MCQ OCR System.
"""

from typing import AsyncGenerator
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from .config import get_settings

# Load environment variables
load_dotenv()

# Get settings
settings = get_settings()

# Database configuration
DATABASE_URL = settings.database.database_url
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=settings.database.database_echo,
    future=True,
    pool_pre_ping=True,
    pool_recycle=settings.database.database_pool_recycle,
    pool_size=settings.database.database_pool_size,
    max_overflow=settings.database.database_max_overflow,
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
    echo=settings.database.database_echo,
    future=True,
    pool_pre_ping=True,
    pool_recycle=settings.database.database_pool_recycle,
    pool_size=settings.database.database_pool_size,
    max_overflow=settings.database.database_max_overflow,
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
            result = await session.execute(text("SELECT 1"))
            print("Database connection successful!")
            return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False


def test_sync_database_connection():
    """
    Test database connection synchronously.
    """
    try:
        with SessionLocal() as session:
            result = session.execute(text("SELECT 1"))
            print("Sync database connection successful!")
            return True
    except Exception as e:
        print(f"Sync database connection failed: {e}")
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
    print("🔄 Initializing database...")
    
    # Test connection
    if not await test_database_connection():
        raise Exception("Failed to connect to database")
    
    # Create tables
    await create_tables()
    
    print("Database initialized successfully!")


# Cleanup function
async def close_db():
    """
    Close database connections.
    """
    await async_engine.dispose()
    sync_engine.dispose()
    print("🔌 Database connections closed")
