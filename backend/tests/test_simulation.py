from fastapi import status
import pytest
import numpy as np
from app import models, simulation

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
    
    # Since we use Geometric Brownian Motion: S_t = S_0 * exp((mu - 0.5*sigma^2)*t)
    # With sigma=0, it becomes S_t = S_0 * exp(mu*t)
    expected_final = initial_investment * np.exp(mu * years)
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

# --- New Historical Data Calculation Tests ---

def test_get_asset_returns():
    # Test with normal data
    prices = [{"date": "2023-01-01", "price": 100.0},
              {"date": "2023-01-02", "price": 101.0},
              {"date": "2023-01-03", "price": 99.99}]
    returns = simulation.get_asset_returns(prices)
    assert len(returns) == 2
    assert returns[0] == pytest.approx(0.01)
    assert returns[1] == pytest.approx(99.99/101 - 1, rel=1e-12)

    # Test with single data point (no returns)
    prices_single = [{"date": "2023-01-01", "price": 100.0}]
    returns_single = simulation.get_asset_returns(prices_single)
    assert len(returns_single) == 0

    # Test with empty data
    prices_empty = []
    returns_empty = simulation.get_asset_returns(prices_empty)
    assert len(returns_empty) == 0

def test_calculate_stats_from_historical_data():
    # Sample historical data for two assets
    historical_data_asset1 = [
        {"date": "2023-01-01", "price": 100.0},
        {"date": "2023-01-02", "price": 101.0},
        {"date": "2023-01-03", "price": 102.0},
        {"date": "2023-01-04", "price": 103.0},
        {"date": "2023-01-05", "price": 104.0},
    ]
    historical_data_asset2 = [
        {"date": "2023-01-01", "price": 50.0},
        {"date": "2023-01-02", "price": 50.5},
        {"date": "2023-01-03", "price": 51.0},
        {"date": "2023-01-04", "price": 51.5},
        {"date": "2023-01-05", "price": 52.0},
    ]
    
    historical_data_list = [historical_data_asset1, historical_data_asset2]
    
    returns, volatilities, correlation_matrix = simulation.calculate_stats_from_historical_data(historical_data_list)
    
    assert len(returns) == 2
    assert len(volatilities) == 2
    assert correlation_matrix.shape == (2, 2)
    assert correlation_matrix[0, 1] == pytest.approx(1.0) # Highly correlated synthetic data
    
    # Test with one asset having empty historical data
    with pytest.raises(ValueError, match="Historical prices data cannot be empty for an asset."):
        simulation.calculate_stats_from_historical_data([historical_data_asset1, []])

def test_prepare_simulation_inputs_with_historical_data():
    # Mock AssetData objects with historical_prices
    class MockAssetData:
        def __init__(self, asset_code, historical_prices, expected_return=None, volatility=None, correlation_matrix=None):
            self.asset_code = asset_code
            self.historical_prices = historical_prices
            self.expected_return = expected_return
            self.volatility = volatility
            self.correlation_matrix = correlation_matrix

    asset1_hist = [
        {"date": "2023-01-01", "price": 100.0},
        {"date": "2023-01-02", "price": 101.0},
    ]
    asset2_hist = [
        {"date": "2023-01-01", "price": 50.0},
        {"date": "2023-01-02", "price": 50.5},
    ]

    mock_asset1 = MockAssetData("ASSET1", asset1_hist)
    mock_asset2 = MockAssetData("ASSET2", asset2_hist)

    # Test when historical_prices are available for all assets
    returns, volatilities, corr_matrix = simulation.prepare_simulation_inputs([mock_asset1, mock_asset2])
    
    assert len(returns) == 2
    assert len(volatilities) == 2
    assert corr_matrix.shape == (2, 2)
    
    # Test when historical_prices are NOT available for some assets, should fall back
    mock_asset3 = MockAssetData("ASSET3", None, expected_return=0.06, volatility=0.15, correlation_matrix={"ASSET1": 0.5, "ASSET3": 1.0, "ASSET4": 0.5})
    mock_asset4 = MockAssetData("ASSET4", [], expected_return=0.08, volatility=0.20, correlation_matrix={"ASSET1": 0.6, "ASSET4": 1.0})

    # This will use the explicit expected_return, volatility, correlation_matrix
    returns_fallback, volatilities_fallback, corr_matrix_fallback = simulation.prepare_simulation_inputs([mock_asset3, mock_asset4])
    
    assert returns_fallback[0] == pytest.approx(0.06)
    assert volatilities_fallback[0] == pytest.approx(0.15)
    assert corr_matrix_fallback[0, 1] == pytest.approx(0.5) # From mock_asset3's correlation_matrix

# --- Basic Accumulation Logic Tests ---

def test_calculate_basic_accumulation():
    # Setup
    mu = 0.05
    initial_investment = 1000000
    monthly_contribution = 10000
    years = 10
    
    # Execute
    results = simulation.calculate_basic_accumulation(
        mu=mu,
        initial_investment=initial_investment,
        monthly_contribution=monthly_contribution,
        years=years
    )
    
    # Expected: (1,000,000 * 1.05^10) + (10,000 * 12 * (1.05^10 - 1) / 0.05)
    # 1.05^10 = 1.6288946267774415
    # part1 = 1,628,894.62
    # part2 = 120,000 * (0.6288946) / 0.05 = 120,000 * 12.577892 = 1,509,347.10
    # total = 3,138,241.72
    
    expected_total = (initial_investment * (1 + mu)**years) + (monthly_contribution * 12 * ((1 + mu)**years - 1) / mu)
    
    assert results["final_value"] == pytest.approx(expected_total)
    assert len(results["history"]) == years + 1
    assert results["history"][0]["value"] == initial_investment
    assert results["history"][-1]["value"] == pytest.approx(expected_total)

# --- Basic Accumulation API Integration Tests ---

def test_simulate_basic_accumulation_endpoint(test_client, session_override, fixed_user_id, sample_assets):
    # 1. Create a portfolio
    portfolio_res = test_client.post("/api/portfolios", json={"name": "Basic Sim Test Portfolio", "description": "Testing Basic Sim API"})
    portfolio_id = portfolio_res.json()["id"]
    
    # 2. Add allocations (100% TOPIX)
    test_client.post(f"/api/portfolios/{portfolio_id}/allocations", json={
        "portfolio_id": portfolio_id,
        "asset_code": "TOPIX",
        "weight": 1.0
    })
    
    # 3. Request Basic Accumulation Simulation
    payload = {
        "portfolio_id": portfolio_id,
        "initial_investment": 1000000,
        "monthly_contribution": 30000,
        "years": 5
    }
    
    response = test_client.post("/api/simulate/basic-accumulation", json=payload)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "final_value" in data
    assert "history" in data
    assert len(data["history"]) == 6 # 0 to 5 years
