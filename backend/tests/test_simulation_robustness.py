import pytest
import numpy as np
from app.simulation import calculate_stats_from_historical_data

def test_calculate_stats_with_insufficient_data():
    # 資産 A と B の価格データ（1つしか重なりがない場合、リターンは 1 つになる）
    asset_a_prices = [{"price": 100}, {"price": 110}]
    asset_b_prices = [{"price": 50}, {"price": 55}]
    
    historical_data = [asset_a_prices, asset_b_prices]
    
    # 修正後の挙動：NaN が発生せず、Identity 行列などが返ることを確認
    returns, volatilities, correlations = calculate_stats_from_historical_data(historical_data)
    
    assert not np.isnan(returns).any()
    assert not np.isnan(volatilities).any()
    assert not np.isnan(correlations).any()
    # n=1 のとき、フォールバックにより対角行列 (相関 1, 他 0) が期待される
    assert np.array_equal(correlations, np.eye(2))

def test_calculate_stats_with_only_one_price_point():
    # 価格データが 1 つしかない場合（リターンが計算できない）
    asset_a_prices = [{"price": 100}]
    historical_data = [asset_a_prices]
    
    # 修正後の挙動：ValueError が投げられることを確認
    with pytest.raises(ValueError, match="Insufficient historical data"):
        calculate_stats_from_historical_data(historical_data)

def test_calculate_stats_with_zero_volatility_assets():
    # 価格が一定の資産（リターンが 0、ボラティリティが 0）
    # np.corrcoef は標準偏差で割るため、ボラティリティ 0 だと通常 NaN を発生させる
    asset_a_prices = [{"price": 100}, {"price": 110}, {"price": 121}]
    asset_b_prices = [{"price": 100}, {"price": 100}, {"price": 100}] # Zero Volatility
    
    historical_data = [asset_a_prices, asset_b_prices]
    
    returns, volatilities, correlations = calculate_stats_from_historical_data(historical_data)
    
    assert not np.isnan(correlations).any(), "Expected no NaN in correlations even with zero volatility asset"
    assert correlations[1, 0] == 0.0 or correlations[1, 0] == 0.0 # nan_to_num handles this
