from fastapi import status
import pytest
import numpy as np
from app import models

def test_simulate_risk_parity_endpoint(test_client, sample_assets):
    """
    リスクパリティ計算エンドポイントの正常系テスト。
    """
    payload = {
        "assets": ["TOPIX", "SP500"],
        "bounds": {
            "TOPIX": [0.0, 1.0],
            "SP500": [0.0, 1.0]
        }
    }
    response = test_client.post("/api/simulate/risk-parity", json=payload)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert "expected_return" in data
    assert "volatility" in data
    assert "weights" in data
    
    # 重みの合計が1であることを確認
    assert sum(data["weights"].values()) == pytest.approx(1.0)
    
    # 資産が含まれていることを確認
    assert "TOPIX" in data["weights"]
    assert "SP500" in data["weights"]

def test_simulate_risk_parity_with_constraints(test_client, sample_assets):
    """
    配分制限（bounds）を指定した際のリスクパリティ計算テスト。
    """
    # TOPIX: vol=0.18, SP500: vol=0.16 なので、
    # 本来は SP500 の方が配分が多くなるはずだが、SP500を最大20%に制限してみる
    payload = {
        "assets": ["TOPIX", "SP500"],
        "bounds": {
            "SP500": [0.0, 0.2]
        }
    }
    response = test_client.post("/api/simulate/risk-parity", json=payload)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert data["weights"]["SP500"] == pytest.approx(0.2, abs=1e-4)
    assert data["weights"]["TOPIX"] == pytest.approx(0.8, abs=1e-4)

def test_simulate_risk_parity_asset_not_found(test_client, sample_assets):
    """
    存在しない資産を指定した場合のエラーハンドリングテスト。
    """
    payload = {
        "assets": ["NON_EXISTENT_ASSET", "TOPIX"]
    }
    response = test_client.post("/api/simulate/risk-parity", json=payload)
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_simulate_risk_parity_insufficient_assets(test_client, sample_assets):
    """
    資産が1つしか指定されていない場合のエラーハンドリングテスト。
    """
    payload = {
        "assets": ["TOPIX"]
    }
    response = test_client.post("/api/simulate/risk-parity", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_simulate_risk_parity_cache(test_client, sample_assets, session_override):
    """
    キャッシュが機能しているかを確認するテスト。
    """
    payload = {
        "assets": ["TOPIX", "SP500"]
    }
    
    # 1回目: 計算が実行される
    response1 = test_client.post("/api/simulate/risk-parity", json=payload)
    assert response1.status_code == status.HTTP_200_OK
    data1 = response1.json()
    
    # 2回目: キャッシュから取得される
    response2 = test_client.post("/api/simulate/risk-parity", json=payload)
    assert response2.status_code == status.HTTP_200_OK
    data2 = response2.json()
    
    assert data1 == data2
    
    # DBに結果が保存されていることを直接確認
    from app import models
    cached = session_override.query(models.SimulationResult).filter(
        models.SimulationResult.simulation_type == "risk_parity"
    ).first()
    assert cached is not None
    assert cached.results == data1
