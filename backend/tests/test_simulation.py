from fastapi import status
import pytest
import numpy as np
from app import models, simulation

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

# --- Existing Efficient Frontier Tests ---
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
    
    first_point = data["frontier"][0]
    assert sum(first_point["weights"].values()) == pytest.approx(1.0)

def test_simulate_efficient_frontier_insufficient_assets(test_client, sample_assets):
    payload = {
        "assets": ["TOPIX"],
        "n_points": 10
    }
    response = test_client.post("/api/simulate/efficient-frontier", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

# --- New Monte Carlo Logic Tests ---

def test_calculate_portfolio_stats():
    # Mock data
    expected_returns = np.array([0.05, 0.07])
    # Covariance for 0.18 vol, 0.16 vol and 0.7 correlation
    vol1, vol2, corr = 0.18, 0.16, 0.7
    cov = vol1 * vol2 * corr
    cov_matrix = np.array([[vol1**2, cov], [cov, vol2**2]])
    weights = np.array([0.6, 0.4])
    
    ret, vol = simulation.calculate_portfolio_stats(expected_returns, cov_matrix, weights)
    
    expected_ret = 0.05 * 0.6 + 0.07 * 0.4
    expected_var = (0.6**2 * vol1**2) + (0.4**2 * vol2**2) + (2 * 0.6 * 0.4 * cov)
    expected_vol = np.sqrt(expected_var)
    
    assert ret == pytest.approx(expected_ret)
    assert vol == pytest.approx(expected_vol)

def test_monte_carlo_simulation_basic():
    # Simple setup: 5% return, 0% volatility (deterministic) for testing math
    mu = 0.05
    sigma = 0.0
    initial_investment = 1000000
    monthly_contribution = 0
    years = 10
    n_simulations = 100
    
    results = simulation.monte_carlo_simulation(
        mu=mu,
        sigma=sigma,
        initial_investment=initial_investment,
        monthly_contribution=monthly_contribution,
        years=years,
        n_simulations=n_simulations
    )
    
    expected_final = initial_investment * (1 + mu)**years
    assert results["percentiles"]["50"] == pytest.approx(expected_final, rel=1e-2)
    assert results["元本割れ確率"] == 0.0

def test_monte_carlo_with_contributions():
    mu = 0.0
    sigma = 0.0
    initial_investment = 1000000
    monthly_contribution = 10000
    years = 1
    n_simulations = 10
    
    results = simulation.monte_carlo_simulation(
        mu=mu,
        sigma=sigma,
        initial_investment=initial_investment,
        monthly_contribution=monthly_contribution,
        years=years,
        n_simulations=n_simulations
    )
    
    assert results["percentiles"]["50"] == pytest.approx(1120000)

def test_monte_carlo_with_extra_investments():
    mu = 0.0
    sigma = 0.0
    initial_investment = 1000000
    monthly_contribution = 0
    years = 2
    n_simulations = 10
    extra_investments = [{"year": 1, "amount": 500000}]
    
    results = simulation.monte_carlo_simulation(
        mu=mu,
        sigma=sigma,
        initial_investment=initial_investment,
        monthly_contribution=monthly_contribution,
        years=years,
        n_simulations=n_simulations,
        extra_investments=extra_investments
    )
    
    assert results["percentiles"]["50"] == pytest.approx(1500000)

# --- API Integration Tests ---

def test_simulate_monte_carlo_endpoint(test_client, session_override, fixed_user_id, sample_assets):
    # 1. Create a portfolio
    portfolio_res = test_client.post("/api/portfolios", json={"name": "MC Test Portfolio", "description": "Testing MC API"})
    portfolio_id = portfolio_res.json()["id"]
    
    # 2. Add allocations (60% TOPIX, 40% SP500)
    test_client.post(f"/api/portfolios/{portfolio_id}/allocations", json={
        "portfolio_id": portfolio_id,
        "asset_code": "TOPIX",
        "weight": 0.6
    })
    test_client.post(f"/api/portfolios/{portfolio_id}/allocations", json={
        "portfolio_id": portfolio_id,
        "asset_code": "SP500",
        "weight": 0.4
    })
    
    # 3. Request Monte Carlo Simulation
    payload = {
        "portfolio_id": portfolio_id,
        "initial_investment": 1000000,
        "monthly_contribution": 30000,
        "years": 5,
        "n_simulations": 1000,
        "extra_investments": [
            {"year": 2, "amount": 500000}
        ],
        "target_amount": 5000000
    }
    
    response = test_client.post("/api/simulate/monte-carlo", json=payload)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "percentiles" in data
    assert "元本割れ確率" in data
    assert "目標到達確率" in data
    assert len(data["history"]) == 6 # 0 to 5 years