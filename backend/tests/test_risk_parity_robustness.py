import pytest
import numpy as np
from app.simulation import calculate_risk_parity_weights, build_covariance_matrix, calculate_portfolio_stats

def test_risk_parity_zero_volatility_asset():
    # Covariance matrix for 2 assets, one with zero volatility
    volatilities = [0.2, 0.0]
    correlation_matrix = [[1.0, 0.0], [0.0, 1.0]]
    cov_matrix = build_covariance_matrix(volatilities, correlation_matrix)
    
    # This should not crash and should return something sensible (inverse vol fallback)
    weights = calculate_risk_parity_weights(cov_matrix)
    
    assert not np.isnan(weights).any()
    assert np.isclose(np.sum(weights), 1.0)
    # Asset with 0 vol should have higher weight in inverse vol initialization 
    # but the optimizer might struggle.
    # Our implementation uses init_weights as fallback if it fails.
    assert weights[1] > weights[0]

def test_portfolio_stats_zero_variance():
    # Portfolio stats with zero variance
    expected_returns = np.array([0.05, 0.02])
    cov_matrix = np.zeros((2, 2))
    weights = np.array([0.5, 0.5])
    
    ret, vol = calculate_portfolio_stats(expected_returns, cov_matrix, weights)
    
    assert ret == 0.035
    assert vol == 0.0
    assert not np.isnan(vol)
