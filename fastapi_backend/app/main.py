from contextlib import asynccontextmanager
import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import files_router, templates_router, users_router, marking_router, generator_router
from app.database import init_db, close_db, test_database_connection
from app.config import get_settings
from app.queue import initialize_queue_system, shutdown_queue_system, rabbitmq_manager

settings = get_settings()

handlers=[
        logging.StreamHandler(sys.stdout)  # Send logs to stdout
    ]
logging.basicConfig(level=logging.INFO, handlers=handlers)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    print("Starting MCQ Marking System API...")
    
    try:
        # Initialize database
        await init_db()
        print("Database initialized successfully")
        
        # Initialize queue system
        await initialize_queue_system()
        print("Queue system initialized successfully")
        
    except Exception as e:
        print(f"Initialization failed: {e}")
        raise e
    
    yield
    
    # Shutdown
    print("Shutting down MCQ Marking System API...")
    
    try:
        # Shutdown queue system
        await shutdown_queue_system()
        print("Queue system shutdown complete")
        
        # Close database
        await close_db()
        print("Database connections closed")
        
    except Exception as e:
        print(f"Shutdown error: {e}")
    
    print("Shutdown complete")


app = FastAPI(
    title=settings.app.app_name,
    version=settings.app.app_version,
    description="A comprehensive system for MCQ marking and template management",
    debug=settings.app.debug,
    lifespan=lifespan
)

# Configure CORS for large file uploads
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "MCQ Marking System API"}

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
        "version": settings.app.app_version,
        "environment": settings.app.environment
    }

@app.get("/debug/queue")
async def debug_queue():
    """Debug endpoint to check queue system status."""
    try:
        connection_status = "disconnected"
        if rabbitmq_manager.connection:
            if rabbitmq_manager.connection.is_closed:
                connection_status = "closed"
            else:
                connection_status = "connected"
        
        return {
            "rabbitmq_connection": connection_status,
            "queues_available": list(rabbitmq_manager.queues.keys()) if rabbitmq_manager.queues else [],
            "exchange_available": rabbitmq_manager.exchange is not None,
            "settings": {
                "rabbitmq_url": settings.rabbitmq.rabbitmq_url,
                "rabbitmq_host": settings.rabbitmq.rabbitmq_host,
                "rabbitmq_port": settings.rabbitmq.rabbitmq_port
            }
        }
    except Exception as e:
        return {
            "error": str(e),
            "rabbitmq_connection": "error",
            "queues_available": [],
            "exchange_available": False
        }

# Include routers
app.include_router(files_router)
app.include_router(templates_router)
app.include_router(users_router)
app.include_router(marking_router)
app.include_router(generator_router)

