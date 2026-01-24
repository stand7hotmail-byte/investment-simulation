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