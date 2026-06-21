from contextlib import asynccontextmanager
import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import files_router, templates_router, users_router, marking_router, generator_router, auth_router, faculties_router, dashboard_router
from app.database import init_db, close_db, test_database_connection
from app.config import get_app_name, get_app_version, get_debug, get_environment, get_allowed_hosts
from app.queue import initialize_queue_system, shutdown_queue_system, rabbitmq_manager
from app.api.deps import initialize_websocket_manager


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    logger.info("Starting MCQ Marking System API")

    try:
        ws_manager = initialize_websocket_manager()
        logger.info("WebSocket manager initialized: %s", id(ws_manager))

        await init_db()
        logger.info("Database initialized")

        await initialize_queue_system()
        logger.info("Queue system initialized")

    except Exception as e:
        logger.exception("Initialization failed: %s", e)
        raise

    yield

    logger.info("Shutting down MCQ Marking System API")

    try:
        await shutdown_queue_system()
        logger.info("Queue system shutdown complete")

        await close_db()
        logger.info("Database connections closed")

    except Exception as e:
        logger.exception("Shutdown error: %s", e)

    logger.info("Shutdown complete")


app = FastAPI(
    title=get_app_name(),
    version=get_app_version(),
    description="A comprehensive system for MCQ marking and template management",
    debug=get_debug(),
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_hosts(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(faculties_router)
app.include_router(files_router)
app.include_router(templates_router)
app.include_router(marking_router)
app.include_router(generator_router)
app.include_router(dashboard_router)

@app.get("/health")
async def health_check():
    """Health check endpoint with database and queue connectivity test."""
    db_status = "healthy"
    queue_status = "healthy"
    
    try:
        db_connected = await test_database_connection()
        if not db_connected:
            db_status = "unhealthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    try:
        if not rabbitmq_manager.connection or rabbitmq_manager.connection.is_closed:
            queue_status = "unhealthy: connection not available"
        else:
            queue_status = "healthy"
    except Exception as e:
        queue_status = f"unhealthy: {str(e)}"
    
    overall_status = "healthy"
    if db_status != "healthy" or queue_status != "healthy":
        overall_status = "degraded"
    
    return {
        "status": overall_status,
        "database": db_status,
        "queue": queue_status,
        "version": get_app_version(),
        "environment": get_environment()
    }


