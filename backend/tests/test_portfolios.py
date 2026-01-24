from fastapi import status
import uuid

def test_create_portfolio(test_client):
    response = test_client.post("/api/portfolios", json={"name": "Test Portfolio", "description": "A test portfolio"})
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Test Portfolio"
    assert "id" in data

def test_get_all_portfolios(test_client):
    # Create two portfolios
    test_client.post("/api/portfolios", json={"name": "Portfolio 1", "description": "Desc 1"})
    test_client.post("/api/portfolios", json={"name": "Portfolio 2", "description": "Desc 2"})

    response = test_client.get("/api/portfolios")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 2 # Expect at least the two created portfolios

def test_get_single_portfolio(test_client):
    # Create a portfolio first
    create_response = test_client.post("/api/portfolios", json={"name": "Single Portfolio", "description": "For single get test"})
    assert create_response.status_code == status.HTTP_201_CREATED
    created_portfolio_id = create_response.json()["id"]

    response = test_client.get(f"/api/portfolios/{created_portfolio_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Single Portfolio"
    assert data["id"] == created_portfolio_id

def test_update_portfolio(test_client):
    # Create a portfolio first
    create_response = test_client.post("/api/portfolios", json={"name": "Old Name", "description": "Old Desc"})
    assert create_response.status_code == status.HTTP_201_CREATED
    created_portfolio_id = create_response.json()["id"]

    update_data = {"name": "New Name", "description": "New Desc"}
    response = test_client.put(f"/api/portfolios/{created_portfolio_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "New Name"
    assert data["description"] == "New Desc"
    assert data["id"] == created_portfolio_id

def test_delete_portfolio(test_client):
    # Create a portfolio first
    create_response = test_client.post("/api/portfolios", json={"name": "Portfolio to Delete", "description": "Will be deleted"})
    assert create_response.status_code == status.HTTP_201_CREATED
    created_portfolio_id = create_response.json()["id"]

    response = test_client.delete(f"/api/portfolios/{created_portfolio_id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "Portfolio deleted successfully"}

    # Verify it's deleted
    get_response = test_client.get(f"/api/portfolios/{created_portfolio_id}")
    assert get_response.status_code == status.HTTP_404_NOT_FOUND

def test_create_portfolio_allocation(test_client):
    # First, create a portfolio to link the allocation to
    portfolio_response = test_client.post("/api/portfolios", json={"name": "Portfolio for Allocation", "description": "For testing allocations"})
    assert portfolio_response.status_code == status.HTTP_201_CREATED
    portfolio_data = portfolio_response.json()
    portfolio_id = portfolio_data["id"]

    # Now, attempt to create an allocation for this portfolio
    allocation_data = {
        "portfolio_id": portfolio_id,
        "asset_code": "SPY",
        "weight": 0.5
    }
    response = test_client.post(f"/api/portfolios/{portfolio_id}/allocations", json=allocation_data)
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["asset_code"] == "SPY"
    assert "id" in data
