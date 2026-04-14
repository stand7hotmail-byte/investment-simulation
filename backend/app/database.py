from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects import postgresql
import uuid

from .config import settings

class GUID(TypeDecorator):
    """Platform-independent GUID type.

    Uses PostgreSQL's UUID type, otherwise uses
    CHAR(32), storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(postgresql.UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            # For Postgres, just ensure it is a string representation of UUID
            return str(value)
        else:
            # For others (SQLite), store hex string without dashes
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value).hex
            return value.hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value
from .config import settings
from .log_utils import logger

class GUID(TypeDecorator):
...
def get_engine():
    global _engine
    if _engine is None:
        engine_args = {}
        if settings.sqlalchemy_database_url.startswith("sqlite"):
            engine_args["connect_args"] = {"check_same_thread": False}
        else:
            # Production PostgreSQL hardening
            engine_args["pool_size"] = 10
            engine_args["max_overflow"] = 20
            engine_args["pool_timeout"] = 30
            engine_args["pool_recycle"] = 1800
            engine_args["pool_pre_ping"] = True

        try:
            _engine = create_engine(settings.sqlalchemy_database_url, **engine_args)
            logger.info("Database engine initialized successfully.")
        except Exception as e:
            logger.critical(f"Critical Error: Could not create database engine with URL {settings.sqlalchemy_database_url}: {e}")
            # Do not raise here to allow application to start (SPEC-006: Graceful Fallback)
            return None
    return _engine


def get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        engine = get_engine()
        if engine:
            _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        else:
            logger.error("SessionLocal could not be created because engine is None.")
            # Do not return None here to avoid type errors downstream, let the error propagate later
            return sessionmaker(autocommit=False, autoflush=False, bind=None)
    return _SessionLocal

# SPEC-006: Do NOT initialize engine at the module level!
# engine = get_engine()
# SessionLocal = get_session_local()

Base = declarative_base()
