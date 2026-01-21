import uuid

def test_create_portfolio(test_client):
    response = test_client.post("/api/portfolios", json={"name": "Test Portfolio", "description": "A test portfolio"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Portfolio"
    assert "id" in data

def test_create_portfolio_allocation(test_client):
    # First, create a portfolio to link the allocation to
    portfolio_response = test_client.post("/api/portfolios", json={"name": "Portfolio for Allocation", "description": "For testing allocations"})
    assert portfolio_response.status_code == 200
    portfolio_data = portfolio_response.json()
    portfolio_id = portfolio_data["id"]

    # Now, attempt to create an allocation for this portfolio
    allocation_data = {
        "portfolio_id": portfolio_id,
        "asset_code": "SPY",
        "weight": 0.5
    }
    response = test_client.post(f"/api/portfolios/{portfolio_id}/allocations", json=allocation_data)
    
    # This test is expected to fail with a 404 because the endpoint does not exist yet
    assert response.status_code == 200 
    data = response.json()
    assert data["asset_code"] == "SPY"
    assert "id" in data
