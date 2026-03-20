from importlib import import_module

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import configure_logging, logger
from app.database import models  # noqa: F401
from app.database.db import create_db_and_tables
from app.repositories.event_repository import EventRepository
from app.repositories.resource_repository import ResourceRepository

configure_logging()

startup_error: str | None = None

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Mental wellness platform backend",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every API request and response status."""
    logger.info("Request started: {} {}", request.method, request.url.path)
    response = await call_next(request)
    logger.info("Request finished: {} {} -> {}", request.method, request.url.path, response.status_code)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(_request: Request, exc: Exception):
    """Return readable fallback error for unhandled exceptions."""
    logger.exception("Unhandled server error: {}", str(exc))
    return JSONResponse(status_code=500, content={"detail": "Internal server error. Please try again."})


@app.on_event("startup")
def startup() -> None:
    """Create tables and seed startup data."""
    global startup_error
    startup_error = None
    try:
        create_db_and_tables()
        from sqlmodel import Session

        from app.database.db import engine

        with Session(engine) as session:
            ResourceRepository(session).ensure_seed_data()
            EventRepository(session).ensure_seed_data()
    except Exception as exc:
        startup_error = str(exc)
        logger.exception("Startup initialization failed: {}", startup_error)


@app.get("/")
@app.get("/api")
def root() -> dict[str, str]:
    """Return service status."""
    return {"status": "ok", "service": settings.app_name, "version": settings.app_version}


@app.get("/health")
@app.get("/api/health")
def health() -> dict[str, str | None]:
    """Return health check status."""
    if startup_error:
        return {"status": "degraded", "startup_error": startup_error}
    return {"status": "healthy", "startup_error": None}


def include_router_safe(module_path: str) -> None:
    """Import and register router without crashing app startup."""
    try:
        module = import_module(module_path)
        router = getattr(module, "router", None)
        if router is None:
            raise RuntimeError("router symbol not found")
        app.include_router(router, prefix=settings.api_prefix)
    except Exception as exc:
        logger.exception("Skipping router {} due to import/register error: {}", module_path, str(exc))


ROUTER_MODULES = [
    "app.routers.auth_router",
    "app.routers.habit_router",
    "app.routers.mood_router",
    "app.routers.profile_router",
    "app.routers.assessment_router",
    "app.routers.chat_router",
    "app.routers.resource_router",
    "app.routers.appointment_router",
    "app.routers.event_router",
    "app.routers.community_router",
    "app.routers.dashboard_router",
    "app.routers.insights_router",
    "app.routers.voice_router",
]

for module_name in ROUTER_MODULES:
    include_router_safe(module_name)
