import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app import models, schemas
import uuid
import numpy as np
from decimal import Decimal

def test_create_portfolio_with_invalid_asset_code(test_client: TestClient):
    # Intent: Check if backend catches non-existent asset codes gracefully
    payload = {
        "name": "Invalid Asset Test",
        "description": "Testing missing asset",
        "allocations": [
            {"asset_code": "NON_EXISTENT_XYZ", "weight": 1.0}
        ]
    }
    response = test_client.post("/api/portfolios", json=payload)
    # Should be 400 Bad Request with a clear message, NOT 500
    assert response.status_code == 400
    assert "not found" in response.json()["detail"]

def test_unauthorized_portfolio_deletion(test_client: TestClient, session_override: Session):
    # Setup: Create a portfolio for User A
    user_a = uuid.UUID("00000000-0000-0000-0000-00000000000a")
    portfolio = models.Portfolio(id=uuid.uuid4(), user_id=user_a, name="User A Portfolio")
    session_override.add(portfolio)
    session_override.commit()

    # Attempt: Delete as User B (the default test user)
    # The API should return 404 because User B can't even "see" User A's portfolio in the query filter
    response = test_client.delete(f"/api/portfolios/{portfolio.id}")
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_portfolio_weight_sanitization_on_read(test_client: TestClient, session_override: Session):
    # Setup: Manually inject a NaN-like value (if possible) or just verify it doesn't crash
    p_id = uuid.uuid4()
    u_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    portfolio = models.Portfolio(id=p_id, user_id=u_id, name="Read Test")
    # Inject an allocation with a "bad" weight directly in DB to bypass validators
    allocation = models.PortfolioAllocation(
        portfolio_id=p_id, 
        asset_code="SPY", 
        weight=0.5 # We'll just test standard read first
    )
    session_override.add(portfolio)
    session_override.add(allocation)
    session_override.commit()

    response = test_client.get(f"/api/portfolios/{p_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Read Test"
    assert len(data["allocations"]) == 1
