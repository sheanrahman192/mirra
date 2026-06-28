from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_health_cors_header():
    r = client.get("/health", headers={"Origin": "http://localhost:8081"})
    assert "access-control-allow-origin" in r.headers
