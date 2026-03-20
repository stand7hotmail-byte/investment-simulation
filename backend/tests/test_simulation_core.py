import pytest
import numpy as np
from app import simulation

def test_annualize_returns_basic():
    # Test normalization and clipping
    # (1 + 0.01)^252 - 1 is about 11.27
    multiplier = np.array([1.01])
    result = simulation.annualize_returns(multiplier, factor=252)
    assert result[0] == pytest.approx(5.0) # Clipped to max_ret

def test_annualize_returns_lower_bound():
    # Test near total loss
    multiplier = np.array([0.01])
    result = simulation.annualize_returns(multiplier, factor=252)
    assert result[0] == pytest.approx(-0.95) # Clipped to min_ret

def test_calculate_portfolio_stats_basic():
    # 期待収益率 10%, ボラティリティ 20% の資産 100% のポートフォリオ
    expected_returns = np.array([0.1])
    covariance_matrix = np.array([[0.04]]) # 0.2^2
    weights = np.array([1.0])
    
    ret, vol = simulation.calculate_portfolio_stats(expected_returns, covariance_matrix, weights)
    
    assert ret == pytest.approx(0.1)
    assert vol == pytest.approx(0.2)

def test_build_covariance_matrix_orthogonality():
    # 相関 0 の 2 資産
    vols = [0.1, 0.2]
    corrs = [[1.0, 0.0], [0.0, 1.0]]
    
    cov = simulation.build_covariance_matrix(vols, corrs)
    
    assert cov[0, 0] == pytest.approx(0.01)
    assert cov[1, 1] == pytest.approx(0.04)
    assert cov[0, 1] == 0.0
    assert cov[1, 0] == 0.0

def test_prepare_simulation_inputs_with_mock_assets():
    class MockAsset:
        def __init__(self, code, ret, vol, corrs):
            self.asset_code = code
            self.expected_return = ret
            self.volatility = vol
            self.correlation_matrix = corrs

    assets = [
        MockAsset("A", 0.05, 0.1, {"B": 0.5}),
        MockAsset("B", 0.08, 0.2, {"A": 0.5})
    ]
    
    rets, vols, corrs = simulation.prepare_simulation_inputs(assets)
    
    assert len(rets) == 2
    assert rets[0] == 0.05
    assert vols[1] == 0.2
    assert corrs[0, 1] == 0.5
    assert corrs[1, 0] == 0.5
