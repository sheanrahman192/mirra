import time

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from jose import jwt

from app.auth import verify_token

_app = FastAPI()

@_app.get("/me")
def _me(user_id: str = Depends(verify_token)):
    return {"user_id": user_id}

client = TestClient(_app)
SECRET = "test-jwt-secret"


def _token(payload: dict, secret: str = SECRET, algo: str = "HS256") -> str:
    return jwt.encode(payload, secret, algorithm=algo)


def test_valid_token():
    r = client.get("/me", headers={"Authorization": f"Bearer {_token({'sub': 'user-123'})}"})
    assert r.status_code == 200
    assert r.json() == {"user_id": "user-123"}


def test_missing_header():
    assert client.get("/me").status_code == 401


def test_malformed_token():
    r = client.get("/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert r.status_code == 401


def test_expired_token():
    token = _token({"sub": "user-123", "exp": int(time.time()) - 10})
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_wrong_secret():
    token = _token({"sub": "user-123"}, secret="wrong-secret")
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_missing_sub():
    token = _token({"uid": "user-123"})
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
