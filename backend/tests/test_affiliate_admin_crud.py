import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app import models, schemas

def test_admin_get_all_affiliates(test_client: TestClient, session_override: Session):
    # Setup: Add some brokers
    broker1 = models.AffiliateBroker(
        name="Broker 1", region="JP", description=["Desc 1"], 
        cta_text="CTA 1", affiliate_url="http://b1.com"
    )
    broker2 = models.AffiliateBroker(
        name="Broker 2", region="GLOBAL", description=["Desc 2"], 
        cta_text="CTA 2", affiliate_url="http://b2.com"
    )
    session_override.add(broker1)
    session_override.add(broker2)
    session_override.commit()

    response = test_client.get("/api/admin/affiliates")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert any(b["name"] == "Broker 1" for b in data)
    assert any(b["name"] == "Broker 2" for b in data)

def test_admin_create_affiliate(test_client: TestClient):
    payload = {
        "name": "New Broker",
        "region": "JP",
        "description": ["Fast Execution", "Low Fees"],
        "cta_text": "Join Now",
        "affiliate_url": "https://newbroker.com",
        "priority": 10
    }
    response = test_client.post("/api/admin/affiliates", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Broker"
    assert data["id"] is not None
    assert data["is_active"] is True

def test_admin_update_affiliate(test_client: TestClient, session_override: Session):
    # Setup
    broker = models.AffiliateBroker(
        name="Update Me", region="JP", description=["Old"], 
        cta_text="Old CTA", affiliate_url="http://old.com"
    )
    session_override.add(broker)
    session_override.commit()
    session_override.refresh(broker)

    payload = {"name": "Updated Name", "priority": 99}
    response = test_client.patch(f"/api/admin/affiliates/{broker.id}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["priority"] == 99

def test_admin_delete_affiliate(test_client: TestClient, session_override: Session):
    # Setup
    broker = models.AffiliateBroker(
        name="Delete Me", region="JP", description=["Del"], 
        cta_text="Del CTA", affiliate_url="http://del.com"
    )
    session_override.add(broker)
    session_override.commit()
    session_override.refresh(broker)

    response = test_client.delete(f"/api/admin/affiliates/{broker.id}")
    assert response.status_code == 200
    
    # Verify deletion
    response = test_client.get("/api/admin/affiliates")
    data = response.json()
    assert not any(b["id"] == broker.id for b in data)

def test_admin_update_nonexistent_broker(test_client: TestClient):
    response = test_client.patch("/api/admin/affiliates/99999", json={"name": "Fail"})
    assert response.status_code == 404

def test_admin_delete_nonexistent_broker(test_client: TestClient):
    response = test_client.delete("/api/admin/affiliates/99999")
    assert response.status_code == 404
