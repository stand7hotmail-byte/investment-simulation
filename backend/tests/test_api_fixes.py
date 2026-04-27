import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import asyncio
import time

def test_market_summary_exists(test_client):
    # This should fail with 404 because /api/market-summary is not implemented yet
    response = test_client.get("/api/market-summary")
    assert response.status_code == 200, f"Expected 200 but got {response.status_code}. Details: {response.json()}"

@pytest.mark.anyio
async def test_request_coalescing_logic():
    from app.routers import analytics
    assert hasattr(analytics, 'get_market_summary'), "Market summary logic missing in analytics router"

