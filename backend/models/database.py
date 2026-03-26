from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
import os

# Use SQLite for local dev if no DATABASE_URL is set (no PostgreSQL needed)
_db_url = os.getenv("DATABASE_URL", "")
if not _db_url or "postgresql" in _db_url and "asyncpg" not in _db_url:
    DATABASE_URL = "sqlite+aiosqlite:///./docplatform.db"
else:
    DATABASE_URL = _db_url

# SQLite needs check_same_thread=False via connect_args
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_async_engine(DATABASE_URL, echo=False, connect_args=_connect_args)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
