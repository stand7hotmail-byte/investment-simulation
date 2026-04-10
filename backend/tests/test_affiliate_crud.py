import pytest
from sqlalchemy.orm import Session
from app import models, crud, schemas

def test_get_active_affiliates_by_region(session_override: Session):
    # Setup: Clear existing brokers to ensure clean state
    session_override.query(models.AffiliateBroker).delete()
    session_override.commit()

    # Setup: Create some affiliate brokers
    affiliates = [
        models.AffiliateBroker(
            name="Broker 1",
            region="JP",
            description=["Desc 1"],
            cta_text="CTA 1",
            affiliate_url="http://example.com/1",
            priority=10,
            is_active=True
        ),
        models.AffiliateBroker(
            name="Broker 2",
            region="JP",
            description=["Desc 2"],
            cta_text="CTA 2",
            affiliate_url="http://example.com/2",
            priority=20,
            is_active=True
        ),
        models.AffiliateBroker(
            name="Broker 3",
            region="GLOBAL",
            description=["Desc 3"],
            cta_text="CTA 3",
            affiliate_url="http://example.com/3",
            priority=5,
            is_active=True
        ),
        models.AffiliateBroker(
            name="Inactive Broker",
            region="JP",
            description=["Inactive"],
            cta_text="CTA Inactive",
            affiliate_url="http://example.com/inactive",
            priority=30,
            is_active=False
        ),
    ]
    for a in affiliates:
        session_override.add(a)
    session_override.commit()

    # Test JP region
    jp_affiliates = crud.get_active_affiliates_by_region(session_override, "JP")
    assert len(jp_affiliates) == 2
    # Check priority order (Broker 2 has 20, Broker 1 has 10)
    assert jp_affiliates[0].name == "Broker 2"
    assert jp_affiliates[1].name == "Broker 1"

    # Test GLOBAL region
    global_affiliates = crud.get_active_affiliates_by_region(session_override, "GLOBAL")
    assert len(global_affiliates) == 1
    assert global_affiliates[0].name == "Broker 3"

    # Test unknown region
    none_affiliates = crud.get_active_affiliates_by_region(session_override, "US")
    assert len(none_affiliates) == 0

def test_affiliate_schemas():
    # Test Pydantic schema validation
    broker_data = {
        "name": "Test Broker",
        "region": "JP",
        "description": ["Point 1", "Point 2"],
        "cta_text": "Open Account",
        "affiliate_url": "https://example.com/aff",
        "logo_url": "https://example.com/logo.png",
        "priority": 100
    }
    
    # Base schema
    base = schemas.AffiliateBrokerBase(**broker_data)
    assert base.name == "Test Broker"
    assert base.description == ["Point 1", "Point 2"]
    
    # Read schema (includes id and is_active)
    read_data = broker_data.copy()
    read_data["id"] = 1
    read_data["is_active"] = True
    
    read = schemas.AffiliateBrokerRead(**read_data)
    assert read.id == 1
    assert read.is_active is True
    assert read.priority == 100
