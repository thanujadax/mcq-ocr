from .files import router as files_router
from .templates import router as templates_router
from .users import router as users_router
from .marking import router as marking_router
from .generator import router as generator_router
from .auth import router as auth_router
from .faculties import router as faculties_router
from .dashboard import router as dashboard_router

__all__ = ["files_router", "templates_router", "users_router", "marking_router", "generator_router", "auth_router", "faculties_router", "dashboard_router"]


