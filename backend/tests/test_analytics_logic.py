import pytest
import numpy as np
from app import simulation

def test_calculate_stress_test_performance_basic():
    # 2資産のポートフォリオ (50/50)
    # 資産A: 100 -> 80 -> 110 (20%下落後、回復)
    # 資産B: 100 -> 90 -> 95  (10%下落後、少し回復)
    
    hist_prices_a = [
        {"date": "2008-09-01", "price": 100.0},
        {"date": "2008-10-01", "price": 80.0},
        {"date": "2009-01-01", "price": 110.0},
    ]
    hist_prices_b = [
        {"date": "2008-09-01", "price": 100.0},
        {"date": "2008-10-01", "price": 90.0},
        {"date": "2009-01-01", "price": 95.0},
    ]
    
    historical_data_list = [hist_prices_a, hist_prices_b]
    weights = [0.5, 0.5]
    
    # 2008-09-01 から 2009-01-01 までのパフォーマンスを計算
    # 期待値:
    # 2008-10-01 時点: (0.5 * 0.8) + (0.5 * 0.9) = 0.85 (15%下落)
    # 2009-01-01 時点: (0.5 * 1.1) + (0.5 * 0.95) = 1.025 (2.5%上昇)
    # 最大ドローダウン: 15%
    
    result = simulation.calculate_stress_test_performance(
        historical_data_list, 
        weights, 
        start_date="2008-09-01", 
        end_date="2009-01-01"
    )
    
    assert len(result["history"]) == 3
    assert result["history"][0]["cumulative_return"] == pytest.approx(0.0) # Start is always 0
    assert result["history"][1]["cumulative_return"] == pytest.approx(-0.15)
    assert result["history"][2]["cumulative_return"] == pytest.approx(0.025)
    assert result["max_drawdown"] == pytest.approx(0.15)

def test_calculate_rebalancing_diff():
    # 現在の構成: A=40%, B=60%
    # 目標の構成: A=50%, B=50%
    current_alloc = {"A": 0.4, "B": 0.6}
    target_alloc = {"A": 0.5, "B": 0.5}
    
    diff = simulation.calculate_rebalancing_diff(current_alloc, target_alloc)
    
    assert diff["A"] == pytest.approx(0.1) # 10%不足
    assert diff["B"] == pytest.approx(-0.1) # 10%超過
