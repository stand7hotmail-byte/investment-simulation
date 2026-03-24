import pytest
from sqlalchemy import inspect
from app.database import Base
from app import models

def test_affiliate_brokers_table_exists(session_override):
    inspector = inspect(session_override.bind)
    assert "affiliate_brokers" in inspector.get_table_names()

def test_affiliate_brokers_columns(session_override):
    inspector = inspect(session_override.bind)
    columns = {col["name"]: col for col in inspector.get_columns("affiliate_brokers")}
    
    assert "id" in columns
    assert "name" in columns
    assert "region" in columns
    assert "description" in columns
    assert "cta_text" in columns
    assert "affiliate_url" in columns
    assert "logo_url" in columns
    assert "is_active" in columns
    assert "priority" in columns
    assert "created_at" in columns
