from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.auth import verify_token
from app.db import get_db
from app.main import app

SAMPLE = {
    "id": "00000000-0000-0000-0000-000000000001",
    "user_id": "user-1",
    "created_at": "2026-06-27T00:00:00+00:00",
    "observation": "You asked great questions.",
    "pattern_to_reduce": "Interrupting before the other person finishes.",
    "thing_to_try_next": "Wait 2 seconds before responding.",
    "stats": {
        "talk_listen_ratio": 0.6,
        "question_count": 3,
        "interruption_count": 1,
        "session_duration_minutes": 10.0,
        "user_speech_duration_minutes": 6.0,
        "estimated_wpm": 130.0,
    },
    "transcript": None,
}


def _db(rows: list) -> MagicMock:
    db = MagicMock()
    result = MagicMock()
    result.data = rows
    db.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = result
    return db


def _client(rows: list) -> TestClient:
    app.dependency_overrides[get_db] = lambda: _db(rows)
    app.dependency_overrides[verify_token] = lambda: "user-1"
    return TestClient(app)


def teardown_function():
    app.dependency_overrides.clear()


def test_debriefs_returns_list():
    r = _client([SAMPLE]).get("/debriefs")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["observation"] == SAMPLE["observation"]


def test_debriefs_empty():
    r = _client([]).get("/debriefs")
    assert r.status_code == 200
    assert r.json() == []


def test_debriefs_pagination_params():
    db = _db([])
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[verify_token] = lambda: "user-1"
    TestClient(app).get("/debriefs?limit=10&offset=20")
    db.table.return_value.select.return_value.eq.return_value.order.return_value.range.assert_called_once_with(20, 29)
