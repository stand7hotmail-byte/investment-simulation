import pytest
from sqlalchemy import inspect
from app.database import Base

def test_portfolios_table_exists(session_override):
    inspector = inspect(session_override.bind)
    assert "portfolios" in inspector.get_table_names()
