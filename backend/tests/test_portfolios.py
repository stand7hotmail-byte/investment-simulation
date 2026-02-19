from fastapi import status
import uuid
from decimal import Decimal

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

def test_create_portfolio_with_allocations(test_client):
    portfolio_data = {
        "name": "Full Portfolio",
        "description": "With initial allocations",
        "allocations": [
            {"asset_code": "AAPL", "weight": 0.6},
            {"asset_code": "MSFT", "weight": 0.4}
        ]
    }
    response = test_client.post("/api/portfolios", json=portfolio_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Full Portfolio"
    assert "allocations" in data
    assert len(data["allocations"]) == 2
    assert any(a["asset_code"] == "AAPL" and Decimal(str(a["weight"])) == Decimal("0.6") for a in data["allocations"])

def test_update_portfolio_with_allocations(test_client):
    # Create initial
    portfolio_data = {
        "name": "Old Portfolio",
        "allocations": [{"asset_code": "AAPL", "weight": 1.0}]
    }
    create_response = test_client.post("/api/portfolios", json=portfolio_data)
    portfolio_id = create_response.json()["id"]

    # Update with new allocations
    update_data = {
        "name": "New Portfolio",
        "allocations": [
            {"asset_code": "MSFT", "weight": 0.5},
            {"asset_code": "GOOG", "weight": 0.5}
        ]
    }
    response = test_client.put(f"/api/portfolios/{portfolio_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "New Portfolio"
    assert len(data["allocations"]) == 2
    assert any(a["asset_code"] == "MSFT" for a in data["allocations"])
    assert not any(a["asset_code"] == "AAPL" for a in data["allocations"])

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

# Failing tests for asset allocations
def test_get_portfolio_allocations(test_client):
    portfolio_response = test_client.post("/api/portfolios", json={"name": "Portfolio for Allocations", "description": "Test allocations"})
    assert portfolio_response.status_code == status.HTTP_201_CREATED
    portfolio_id = portfolio_response.json()["id"]

    # Create a few allocations
    test_client.post(f"/api/portfolios/{portfolio_id}/allocations", json={"portfolio_id": portfolio_id, "asset_code": "AAPL", "weight": 0.5})
    test_client.post(f"/api/portfolios/{portfolio_id}/allocations", json={"portfolio_id": portfolio_id, "asset_code": "MSFT", "weight": 0.3})

    response = test_client.get(f"/api/portfolios/{portfolio_id}/allocations")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 2
    assert any(alloc["asset_code"] == "AAPL" for alloc in data)
    assert any(alloc["asset_code"] == "MSFT" for alloc in data)

def test_get_single_portfolio_allocation(test_client):
    portfolio_response = test_client.post("/api/portfolios", json={"name": "Portfolio for Single Allocation", "description": "Test single allocation"})
    assert portfolio_response.status_code == status.HTTP_201_CREATED
    portfolio_id = portfolio_response.json()["id"]

    allocation_create_response = test_client.post(f"/api/portfolios/{portfolio_id}/allocations", json={"portfolio_id": portfolio_id, "asset_code": "GOOG", "weight": 1.0})
    assert allocation_create_response.status_code == status.HTTP_201_CREATED
    allocation_id = allocation_create_response.json()["id"]

    response = test_client.get(f"/api/portfolios/{portfolio_id}/allocations/{allocation_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["asset_code"] == "GOOG"
    assert data["id"] == allocation_id

def test_update_portfolio_allocation(test_client):
    portfolio_response = test_client.post("/api/portfolios", json={"name": "Portfolio for Update Allocation", "description": "Test update allocation"})
    assert portfolio_response.status_code == status.HTTP_201_CREATED
    portfolio_id = portfolio_response.json()["id"]

    allocation_create_response = test_client.post(f"/api/portfolios/{portfolio_id}/allocations", json={"portfolio_id": portfolio_id, "asset_code": "AMZN", "weight": 0.7})
    assert allocation_create_response.status_code == status.HTTP_201_CREATED
    allocation_id = allocation_create_response.json()["id"]

    update_data = {"weight": 0.8}
    response = test_client.put(f"/api/portfolios/{portfolio_id}/allocations/{allocation_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert Decimal(str(data["weight"])) == Decimal("0.8")
    assert data["id"] == allocation_id

def test_delete_portfolio_allocation(test_client):
    portfolio_response = test_client.post("/api/portfolios", json={"name": "Portfolio for Delete Allocation", "description": "Test delete allocation"})
    assert portfolio_response.status_code == status.HTTP_201_CREATED
    portfolio_id = portfolio_response.json()["id"]

    allocation_create_response = test_client.post(f"/api/portfolios/{portfolio_id}/allocations", json={"portfolio_id": portfolio_id, "asset_code": "TSLA", "weight": 0.2})
    assert allocation_create_response.status_code == status.HTTP_201_CREATED
    allocation_id = allocation_create_response.json()["id"]

    response = test_client.delete(f"/api/portfolios/{portfolio_id}/allocations/{allocation_id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "Allocation deleted successfully"}

    # Verify it's deleted
    get_response = test_client.get(f"/api/portfolios/{portfolio_id}/allocations/{allocation_id}")
    assert get_response.status_code == status.HTTP_404_NOT_FOUND
