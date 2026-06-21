import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import ASYNC_DATABASE_URL, Base, get_async_db

# Create an async engine using the existing database URL
engine = create_async_engine(ASYNC_DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# ----------------------------
# FIXTURES
# ----------------------------

@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    """
    Set up test database.
    """
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Return engine for use in tests
    yield engine
    
    # Clean up
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture()
async def db_session():
    """
    Create a new async database session for a single test.
    """
    async with AsyncSessionLocal() as session:
        yield session
        await session.close()


@pytest.fixture()
async def async_client():
    """
    Create an AsyncClient for testing FastAPI endpoints.
    """
    async with AsyncSessionLocal() as session:
        async def override_get_async_db():
            yield session

        app.dependency_overrides[get_async_db] = override_get_async_db
        
        # Create client with app.url_path_for
        test_client = TestClient(app)
        async with AsyncClient(
            app=test_client.app,
            base_url="http://testserver"
        ) as client:
            yield client
            
        app.dependency_overrides.clear()
