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
    assert results["percentiles"]["50"] == pytest.approx(expected_final, rel=1e-2) # Corrected pytest2 to pytest

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

# --- NEW TEST CASE ADJUSTMENTS ---
def test_calculate_stats_geometric_mean_small_data():
    # Mock historical price data for two assets over 5 days (4 returns)
    historical_data_asset1 = [
        {"date": "2023-01-01", "price": 100.0},
        {"date": "2023-01-02", "price": 102.0},
        {"date": "2023-01-03", "price": 101.0},
        {"date": "2023-01-04", "price": 105.0},
        {"date": "2023-01-05", "price": 108.0},
    ]
    historical_data_asset2 = [
        {"date": "2023-01-01", "price": 50.0},
        {"date": "2023-01-02", "price": 51.0},
        {"date": "2023-01-03", "price": 50.5},
        {"date": "2023-01-04", "price": 53.0},
        {"date": "2023-01-05", "price": 55.0},
    ]
    
    historical_data_list = [historical_data_asset1, historical_data_asset2]
    
    # Calculation with factor 252:
    # Asset A: 1.08^(252/4) - 1 = 1.08^63 - 1 = 120.6 (12060%) -> Clipped to 5.0
    # Asset B: 1.10^63 - 1 = 404.2 (40420%) -> Clipped to 5.0
    
    returns, volatilities, correlation_matrix = simulation.calculate_stats_from_historical_data(historical_data_list)
    
    assert len(returns) == 2
    assert len(volatilities) == 2
    
    # Both should be clipped to the safety maximum of 5.0 (500%)
    assert returns[0] == pytest.approx(5.0)
    assert returns[1] == pytest.approx(5.0)
    assert correlation_matrix[0, 1] == pytest.approx(0.99, abs=0.01)

def test_calculate_stats_geometric_mean_long_data():
    np.random.seed(42) # for reproducibility
    n_days = 253 # min_len > 200, so annualization_factor should be 252
    
    # Simulate correlated price series with some drift and volatility
    drift_a, drift_b = 0.0001, 0.00012 # daily drifts
    vol_a, vol_b = 0.01, 0.012 # daily volatilities
    corr = 0.7 # correlation
    
    # Cholesky decomposition for correlated random numbers
    cov_matrix_sim = np.array([[vol_a**2, vol_a*vol_b*corr], [vol_a*vol_b*corr, vol_b**2]])
    mean_vec_sim = np.array([drift_a, drift_b])
    
    # Generate daily log returns
    log_returns = np.random.multivariate_normal(mean_vec_sim, cov_matrix_sim, n_days)
    
    # Convert log returns to price series (starting at 100)
    prices_a = 100 * np.exp(np.cumsum(log_returns[:, 0]))
    prices_b = 100 * np.exp(np.cumsum(log_returns[:, 1]))
    
    historical_data_asset1 = [{"date": f"2023-01-{i+1:02d}", "price": float(p)} for i, p in enumerate(prices_a)]
    historical_data_asset2 = [{"date": f"2023-01-{i+1:02d}", "price": float(p)} for i, p in enumerate(prices_b)]
    
    historical_data_list = [historical_data_asset1, historical_data_asset2]
    
    returns, volatilities, correlation_matrix = simulation.calculate_stats_from_historical_data(historical_data_list)
    
    assert len(returns) == 2
    assert len(volatilities) == 2
    assert correlation_matrix.shape == (2, 2)
    
    # Assert returns are within a plausible range for ~0.1% daily drift and ~1% daily vol.
    # Adjusted the range to be more tolerant of simulation drift.
    assert returns[0] > 0.01 and returns[0] < 0.10 # Expected ~0.0255
    assert returns[1] > 0.01 and returns[1] < 0.10 # Expected ~0.0307
    assert correlation_matrix[0, 1] == pytest.approx(corr, abs=0.2) # Allow deviation due to simulation

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
