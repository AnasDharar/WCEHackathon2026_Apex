from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.logging import logger
from app.core.config import settings

engine_kwargs = {"echo": False}
if settings.sqlalchemy_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Supabase/Postgres over pooler can drop idle connections; pre_ping recovers transparently.
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(settings.sqlalchemy_url, **engine_kwargs)
_db_initialized = False
_db_init_error: str | None = None


def create_db_and_tables() -> None:
    """Create all SQLModel tables."""
    SQLModel.metadata.create_all(engine)


def ensure_database_initialized() -> None:
    """Initialize database schema once per runtime instance."""
    global _db_initialized, _db_init_error
    if _db_initialized:
        return
    if _db_init_error:
        raise RuntimeError(_db_init_error)
    try:
        create_db_and_tables()
        _db_initialized = True
    except Exception as exc:
        _db_init_error = str(exc)
        logger.exception("Database initialization failed: {}", _db_init_error)
        raise


def get_session() -> Generator[Session, None, None]:
    """Yield a database session for request scope."""
    ensure_database_initialized()
    with Session(engine) as session:
        yield session
