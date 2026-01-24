import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

from app.main import app, get_db, get_current_user_id
from app.database import Base

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def session_override():
    Base.metadata.create_all(bind=engine) # Create tables
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine) # Drop tables after test

@pytest.fixture(scope="function")
def fixed_user_id():
    return uuid.UUID("00000000-0000-0000-0000-000000000001") # Consistent UUID for testing

@pytest.fixture(scope="function") # Changed scope to function
def test_client(session_override, fixed_user_id): # Inject fixtures here
    app.dependency_overrides[get_db] = lambda: session_override # Use lambda to provide the fixture value
    app.dependency_overrides[get_current_user_id] = lambda: fixed_user_id # Use lambda to provide the fixture value
    client = TestClient(app)
    yield client
    app.dependency_overrides = {} # Clean up overrides
