from fastapi import status
import pytest
from app import models

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

def test_simulate_efficient_frontier(test_client, sample_assets):
    payload = {
        "assets": ["TOPIX", "SP500"],
        "n_points": 10
    }
    response = test_client.post("/api/simulate/efficient-frontier", json=payload)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "frontier" in data
    assert len(data["frontier"]) > 0
    assert "max_sharpe" in data
    
    # Verify the first point
    first_point = data["frontier"][0]
    assert "expected_return" in first_point
    assert "volatility" in first_point
    assert "weights" in first_point
    assert "TOPIX" in first_point["weights"]
    assert "SP500" in first_point["weights"]
    
    # Weights should sum to approximately 1
    assert sum(first_point["weights"].values()) == pytest.approx(1.0)

def test_simulate_efficient_frontier_insufficient_assets(test_client, sample_assets):

    payload = {

        "assets": ["TOPIX"],

        "n_points": 10

    }

    response = test_client.post("/api/simulate/efficient-frontier", json=payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
