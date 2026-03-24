from fastapi import status
import pytest
from app import models

@pytest.fixture
def sample_affiliates(session_override):
    # JP affiliate
    jp_broker = models.AffiliateBroker(
        name="SBI証券",
        region="JP",
        description=["業界最低水準の手数料", "豊富な投資信託"],
        cta_text="SBI証券で口座開設",
        affiliate_url="https://example.com/sbi",
        is_active=True,
        priority=10
    )
    # Global affiliate
    global_broker = models.AffiliateBroker(
        name="Interactive Brokers",
        region="GLOBAL",
        description=["Access to 150+ markets", "Low commissions"],
        cta_text="Open an IBKR account",
        affiliate_url="https://example.com/ibkr",
        is_active=True,
        priority=5
    )
    # Inactive JP affiliate
    inactive_broker = models.AffiliateBroker(
        name="Old Broker",
        region="JP",
        description=["No longer active"],
        cta_text="Closed",
        affiliate_url="https://example.com/closed",
        is_active=False,
        priority=0
    )
    session_override.add(jp_broker)
    session_override.add(global_broker)
    session_override.add(inactive_broker)
    session_override.commit()
    return [jp_broker, global_broker, inactive_broker]

def test_get_recommendations_jp(test_client, sample_affiliates):
    # Test JP region detection via cf-ipcountry
    response = test_client.get("/api/affiliates/recommendations", headers={"cf-ipcountry": "JP"})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "SBI証券"
    assert data[0]["region"] == "JP"

def test_get_recommendations_global(test_client, sample_affiliates):
    # Test Global region detection via cf-ipcountry (US)
    response = test_client.get("/api/affiliates/recommendations", headers={"cf-ipcountry": "US"})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Interactive Brokers"
    assert data[0]["region"] == "GLOBAL"

def test_get_recommendations_vercel_header(test_client, sample_affiliates):
    # Test region detection via x-vercel-ip-country
    response = test_client.get("/api/affiliates/recommendations", headers={"x-vercel-ip-country": "JP"})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "SBI証券"

def test_get_recommendations_local_fallback_no_query(test_client, sample_affiliates):
    # Local development fallback (no region query param) should default to JP
    # test_client usually has 127.0.0.1 as remote_addr
    response = test_client.get("/api/affiliates/recommendations")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "SBI証券"

def test_get_recommendations_local_fallback_with_query(test_client, sample_affiliates):
    # Local development fallback with region query param
    response = test_client.get("/api/affiliates/recommendations", params={"region": "GLOBAL"})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Interactive Brokers"
