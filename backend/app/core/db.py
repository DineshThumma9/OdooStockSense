from sqlmodel import Session, SQLModel, create_engine

from .config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # SQL query logging in dev
    pool_pre_ping=True,   # Auto-reconnect on stale connections
)


def create_db_and_tables() -> None:
    """Create all tables on startup (dev). Use Alembic for production migrations."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """FastAPI dependency — yields a DB session per request."""
    with Session(engine) as session:
        yield session
