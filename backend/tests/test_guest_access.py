from fastapi import status
from fastapi.testclient import TestClient
from app.main import app, get_db
import pytest

@pytest.fixture
def guest_client(session_override):
    # get_db だけオーバーライドし、認証(get_current_user_id)はオーバーライドしない
    # これにより、実際の認証ロジック（ヘッダーチェック等）が走る
    app.dependency_overrides[get_db] = lambda: session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides = {}

def test_risk_parity_guest_access_allowed(guest_client, sample_assets):
    """
    ゲストアクセス（認証なし）で risk-parity 計算ができることを確認。
    """
    payload = {
        "assets": ["TOPIX", "SP500"]
    }
    # Authorization ヘッダーなしでリクエスト
    response = guest_client.post("/api/simulate/risk-parity", json=payload)
    
    # 200 OK が返るはず
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "weights" in data
    assert "TOPIX" in data["weights"]
