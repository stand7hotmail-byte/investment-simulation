import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
import sys
import os

# Add the project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.main import app, get_db, get_current_user_id
from app.database import Base
from app import models

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

@pytest.fixture
def sample_assets(session_override):
    assets = [
        models.AssetData(
            asset_code="TOPIX",
            name="東証株価指数",
            asset_class="Stock",
            expected_return=0.05,
            volatility=0.18,
            correlation_matrix={"SP500": 0.7}
        ),
        models.AssetData(
            asset_code="SP500",
            name="S&P 500",
            asset_class="Stock",
            expected_return=0.07,
            volatility=0.16,
            correlation_matrix={"TOPIX": 0.7}
        )
    ]
    for a in assets:
        session_override.add(a)
    session_override.commit()
    return assets
