from sqlmodel import Session, SQLModel, create_engine

from .config import settings

is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # SQL query logging in dev
    connect_args=connect_args,
    **({} if is_sqlite else {"pool_pre_ping": True}),
)


def create_db_and_tables() -> None:
    """Create all tables on startup (dev). Use Alembic for production migrations."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """FastAPI dependency — yields a DB session per request."""
    with Session(engine) as session:
        yield session
