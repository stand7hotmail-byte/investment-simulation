import pytest
import numpy as np
from app import simulation

def test_build_covariance_matrix_pure():
    volatilities = [0.1, 0.2]
    correlation_matrix = [[1.0, 0.5], [0.5, 1.0]]
    cov_matrix = simulation.build_covariance_matrix(volatilities, correlation_matrix)
    
    expected_cov = np.array([
        [0.1*0.1*1.0, 0.1*0.2*0.5],
        [0.1*0.2*0.5, 0.2*0.2*1.0]
    ])
    
    np.testing.assert_array_almost_equal(cov_matrix, expected_cov)

def test_calculate_portfolio_stats_pure():
    expected_returns = np.array([0.05, 0.1])
    cov_matrix = np.array([[0.01, 0.001], [0.001, 0.04]])
    weights = np.array([0.6, 0.4])
    
    ret, vol = simulation.calculate_portfolio_stats(expected_returns, cov_matrix, weights)
    
    expected_ret = 0.05 * 0.6 + 0.1 * 0.4
    expected_vol = np.sqrt(0.6**2 * 0.01 + 0.4**2 * 0.04 + 2 * 0.6 * 0.4 * 0.001)
    
    assert ret == pytest.approx(expected_ret)
    assert vol == pytest.approx(expected_vol)

def test_prepare_simulation_inputs():
    # この関数はまだ存在しないため、テストが失敗することを確認する (Red Phase)
    from app.simulation import prepare_simulation_inputs
    
    class MockAsset:
        def __init__(self, code, ret, vol, corr):
            self.asset_code = code
            self.expected_return = ret
            self.volatility = vol
            self.correlation_matrix = corr
            
    assets = [
        MockAsset("A", 0.05, 0.1, {"A": 1.0, "B": 0.5}),
        MockAsset("B", 0.1, 0.2, {"A": 0.5, "B": 1.0})
    ]
    
    returns, volatilities, corr_matrix = prepare_simulation_inputs(assets)
    
    np.testing.assert_array_equal(returns, np.array([0.05, 0.1]))
    assert volatilities == [0.1, 0.2]
    np.testing.assert_array_equal(corr_matrix, np.array([[1.0, 0.5], [0.5, 1.0]]))
