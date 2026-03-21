from fastapi import status
import uuid
import pytest
from app import models

def test_get_portfolio_stress_test(test_client, session_override):
    # Setup: Create assets with history
    hist_prices = [
        {"date": "2008-09-01", "price": 100.0},
        {"date": "2008-10-01", "price": 80.0},
        {"date": "2009-01-01", "price": 110.0},
    ]
    asset = models.AssetData(
        asset_code="STRESS_A",
        name="Stress Test Asset A",
        historical_prices=hist_prices
    )
    session_override.add(asset)
    session_override.commit()

    # Setup: Create portfolio
    portfolio_data = {
        "name": "Stress Portfolio",
        "allocations": [{"asset_code": "STRESS_A", "weight": 1.0}]
    }
    create_response = test_client.post("/api/portfolios", json=portfolio_data)
    portfolio_id = create_response.json()["id"]

    # Test
    response = test_client.get(f"/api/portfolios/{portfolio_id}/analytics/stress-test")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "lehman_shock" in data
    assert "covid_crash" in data
    assert "dotcom_bubble" in data
    
    lehman = data["lehman_shock"]
    assert "max_drawdown" in lehman
    assert "history" in lehman
    # In this mock case, Lehman should have data because we used the exact dates
    assert len(lehman["history"]) > 0

def test_post_portfolio_rebalance(test_client):
    # Setup: Create portfolio
    portfolio_data = {
        "name": "Rebalance Portfolio",
        "allocations": [
            {"asset_code": "A", "weight": 0.4},
            {"asset_code": "B", "weight": 0.6}
        ]
    }
    create_response = test_client.post("/api/portfolios", json=portfolio_data)
    portfolio_id = create_response.json()["id"]

    # Test
    rebalance_data = {
        "target_weights": {"A": 0.5, "B": 0.5}
    }
    response = test_client.post(f"/api/portfolios/{portfolio_id}/analytics/rebalance", json=rebalance_data)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["diff"]["A"] == pytest.approx(0.1)
    assert data["diff"]["B"] == pytest.approx(-0.1)
