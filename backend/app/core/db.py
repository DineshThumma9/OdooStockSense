from sqlmodel import Session, SQLModel, create_engine

from .config import settings

# PostgreSQL engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,          # SQL query logging in dev
    pool_pre_ping=True,           # Recycle stale connections
    pool_size=10,                 # Max persistent connections
    max_overflow=20,              # Extra connections under load
)


def create_db_and_tables() -> None:
    """Create all tables on startup (dev). Use Alembic for production migrations."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """FastAPI dependency — yields a DB session per request."""
    with Session(engine) as session:
        yield session
