from fastapi import status
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_db, get_current_user_id
import pytest
import uuid

@pytest.fixture
def guest_client(session_override):
    # get_db だけオーバーライドし、認証(get_current_user_id)はオーバーライドしない
    app.dependency_overrides[get_db] = lambda: session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides = {}

@pytest.fixture
def auth_client(session_override, fixed_user_id):
    # get_db, get_current_user_id, get_optional_user_id をオーバーライド
    from app.dependencies import get_optional_user_id
    app.dependency_overrides[get_db] = lambda: session_override
    app.dependency_overrides[get_current_user_id] = lambda: fixed_user_id
    app.dependency_overrides[get_optional_user_id] = lambda: fixed_user_id
    client = TestClient(app)
    # 認証済みであることを示すために適当な Authorization ヘッダーを付ける
    client.headers["Authorization"] = "Bearer dummy-token"
    yield client
    app.dependency_overrides = {}

def test_risk_parity_guest_access(guest_client, sample_assets):
    """ゲストアクセスで risk-parity 計算ができることを確認。"""
    payload = {"assets": ["TOPIX", "SP500"]}
    response = guest_client.post("/api/simulate/risk-parity", json=payload)
    assert response.status_code == status.HTTP_200_OK
    assert "weights" in response.json()

def test_risk_parity_authenticated_access(auth_client, sample_assets, session_override, fixed_user_id):
    """ログインユーザーで risk-parity 計算ができ、DBに保存されることを確認。"""
    payload = {"assets": ["TOPIX", "SP500"]}
    response = auth_client.post("/api/simulate/risk-parity", json=payload)
    assert response.status_code == status.HTTP_200_OK
    
    # DBに保存されていることを確認
    from app import models
    cached = session_override.query(models.SimulationResult).filter(
        models.SimulationResult.user_id == fixed_user_id
    ).first()
    assert cached is not None

def test_efficient_frontier_guest_access(guest_client, sample_assets):
    """ゲストアクセスで efficient-frontier 計算ができることを確認。"""
    payload = {"assets": ["TOPIX", "SP500"], "n_points": 5}
    response = guest_client.post("/api/simulate/efficient-frontier", json=payload)
    assert response.status_code == status.HTTP_200_OK
    assert "frontier" in response.json()

def test_market_summary_guest_access(guest_client):
    """ゲストアクセスで market-summary が取得できることを確認。"""
    response = guest_client.get("/api/market-summary")
    assert response.status_code == status.HTTP_200_OK
