import numpy as np
import pytest
from app import simulation

def test_calculate_risk_parity_weights_equal_vol():
    """
    ボラティリティが等しく相関が0の2資産の場合、配分は50/50になるはず。
    """
    vol = 0.2
    # 共分散行列 (対角行列)
    covariance_matrix = np.array([
        [vol**2, 0.0],
        [0.0, vol**2]
    ])
    
    weights = simulation.calculate_risk_parity_weights(covariance_matrix)
    
    assert weights == pytest.approx(np.array([0.5, 0.5]), abs=1e-4)

def test_calculate_risk_parity_weights_different_vol():
    """
    相関が0で、資産Bのボラティリティが資産Aの2倍の場合、
    w_A * vol_A = w_B * vol_B となるため、w_A = 2 * w_B になるはず。
    つまり、w_A = 2/3, w_B = 1/3。
    """
    vol_a = 0.1
    vol_b = 0.2
    covariance_matrix = np.array([
        [vol_a**2, 0.0],
        [0.0, vol_b**2]
    ])
    
    weights = simulation.calculate_risk_parity_weights(covariance_matrix)
    
    expected_weights = np.array([2/3, 1/3])
    assert weights == pytest.approx(expected_weights, abs=1e-4)

def test_risk_contributions_are_equal():
    """
    相関がある場合でも、各資産のリスク寄与度が等しくなっているかを確認する。
    """
    covariance_matrix = np.array([
        [0.04, 0.01, 0.02],
        [0.01, 0.09, 0.01],
        [0.02, 0.01, 0.16]
    ])
    
    weights = simulation.calculate_risk_parity_weights(covariance_matrix)
    
    # リスク寄与度の計算: RC_i = w_i * (Sigma * w)_i / sqrt(w' * Sigma * w)
    portfolio_vol = np.sqrt(weights.T @ covariance_matrix @ weights)
    marginal_risk_contribution = (covariance_matrix @ weights) / portfolio_vol
    risk_contributions = weights * marginal_risk_contribution
    
    # 全てのリスク寄与度が等しいことを確認
    mean_rc = np.mean(risk_contributions)
    for rc in risk_contributions:
        assert rc == pytest.approx(mean_rc, abs=1e-5)

def test_calculate_risk_parity_with_bounds():
    """
    境界条件（配分制限）がある場合のリスクパリティ計算。
    """
    vol_a = 0.1
    vol_b = 0.2
    covariance_matrix = np.array([
        [vol_a**2, 0.0],
        [0.0, vol_b**2]
    ])
    # 本来は 2/3 (0.666) と 1/3 (0.333) だが、
    # 資産Aに最大 0.5 の制限をかける
    bounds = [(0, 0.5), (0, 1.0)]
    
    weights = simulation.calculate_risk_parity_weights(covariance_matrix, bounds=bounds)
    
    # 資産Aが上限の 0.5 に張り付き、残りが資産Bになるはず
    assert weights[0] == pytest.approx(0.5, abs=1e-4)
    assert weights[1] == pytest.approx(0.5, abs=1e-4)
