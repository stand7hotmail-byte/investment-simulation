from fastapi import status
import pytest
from app import models

@pytest.fixture
def sample_asset(session_override):
    asset = models.AssetData(
        asset_code="TOPIX",
        name="東証株価指数",
        asset_class="Stock",
        expected_return=0.05,
        volatility=0.18,
        correlation_matrix={"TOPIX": 1.0}
    )
    session_override.add(asset)
    session_override.commit()
    return asset

def test_read_assets_not_empty(test_client, sample_asset):
    response = test_client.get("/api/assets")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) > 0
    assert any(asset["asset_code"] == sample_asset.asset_code for asset in data)

def test_read_specific_asset(test_client, sample_asset):
    response = test_client.get(f"/api/assets/{sample_asset.asset_code}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["asset_code"] == sample_asset.asset_code
    assert data["name"] == sample_asset.name
    assert "correlation_matrix" in data

def test_read_nonexistent_asset(test_client):
    response = test_client.get("/api/assets/NONEXISTENT")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_asset_historical_data(test_client, session_override):
    # Create an asset with historical data
    asset_with_hist = models.AssetData(
        asset_code="TEST_HIST",
        name="Test Historical Asset",
        asset_class="Test",
        expected_return=0.1,
        volatility=0.2,
        correlation_matrix={},
        historical_prices=[
            {"date": "2020-01-01", "price": 100.0},
            {"date": "2020-01-02", "price": 101.5}
        ]
    )
    session_override.add(asset_with_hist)
    session_override.commit()

    response = test_client.get(f"/api/assets/{asset_with_hist.asset_code}/historical-data")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["asset_code"] == "TEST_HIST"
    assert len(data["historical_prices"]) == 2
    assert data["historical_prices"][0]["date"] == "2020-01-01"
    assert data["historical_prices"][0]["price"] == "100.0"

def test_get_asset_historical_data_nonexistent_asset(test_client):
    response = test_client.get("/api/assets/NONEXISTENT_HIST/historical-data")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_asset_historical_data_no_historical_prices(test_client, session_override):
    # Create an asset without historical data
    asset_no_hist = models.AssetData(
        asset_code="NO_HIST",
        name="Asset No Hist",
        asset_class="Test",
        expected_return=0.1,
        volatility=0.2,
        correlation_matrix={}
    )
    session_override.add(asset_no_hist)
    session_override.commit()

    response = test_client.get(f"/api/assets/{asset_no_hist.asset_code}/historical-data")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["asset_code"] == "NO_HIST"
    assert data["historical_prices"] == []