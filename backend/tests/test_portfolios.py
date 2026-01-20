def test_create_portfolio(test_client):
    response = test_client.post("/api/portfolios", json={"name": "Test Portfolio", "description": "A test portfolio"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Portfolio"
    assert "id" in data
