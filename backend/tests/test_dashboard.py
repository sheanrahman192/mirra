from dataclasses import dataclass
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.auth import verify_token
from app.dashboard import build_profile_summary, build_progress, conversation_item, fallback_reflection
from app.db import get_db
from app.main import app


ROW_1 = {
    "id": "00000000-0000-0000-0000-000000000101",
    "session_id": "session-101",
    "user_id": "user-1",
    "created_at": "2026-07-07T18:30:00+00:00",
    "observation": "You asked great questions.",
    "pattern_to_reduce": "Jumping in early.",
    "thing_to_try_next": "Try one breath before answering.",
    "stats": {
        "talk_listen_ratio": 0.55,
        "question_count": 9,
        "interruption_count": 1,
        "session_duration_minutes": 20.0,
        "user_speech_duration_minutes": 11.0,
        "estimated_wpm": 132.0,
        "metadata": {"title": "Coffee with Maya"},
    },
    "transcript": "Honestly, what was that like? I mean, you know, what changed?",
}

ROW_2 = {
    "id": "00000000-0000-0000-0000-000000000102",
    "session_id": "session-102",
    "user_id": "user-1",
    "created_at": "2026-07-08T18:30:00+00:00",
    "observation": "You spoke for most of the conversation.",
    "pattern_to_reduce": "Long monologues.",
    "thing_to_try_next": "Ask one follow-up question.",
    "stats": {
        "talk_listen_ratio": 2.0,
        "question_count": 2,
        "interruption_count": 3,
        "session_duration_minutes": 40.0,
        "user_speech_duration_minutes": 28.0,
        "estimated_wpm": 145.0,
    },
    "transcript": "Like actually this was kind of a long update.",
}


@dataclass
class _Result:
    data: object


class _HttpResponse:
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self.payload = payload

    def json(self):
        return self.payload


class _Table:
    def __init__(self, name: str, rows: list[dict], used: int):
        self.name = name
        self.rows = rows
        self.used = used
        self.filters: list[tuple[str, object]] = []
        self.single = False
        self.start = 0
        self.end: int | None = None
        self.desc = False

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters.append((key, value))
        return self

    def order(self, _key, desc=False):
        self.desc = desc
        return self

    def range(self, start, end):
        self.start = start
        self.end = end
        return self

    def maybe_single(self):
        self.single = True
        return self

    def execute(self):
        if self.name == "debrief_usage":
            return _Result({"count": self.used} if self.used else None)

        rows = self.rows
        for key, value in self.filters:
            rows = [row for row in rows if str(row.get(key)) == str(value)]
        rows = sorted(rows, key=lambda row: row["created_at"], reverse=self.desc)
        if self.single:
            return _Result(rows[0] if rows else None)
        end = self.end if self.end is not None else len(rows) - 1
        return _Result(rows[self.start : end + 1])


class _Db:
    def __init__(self, rows: list[dict], used: int = 2):
        self.rows = rows
        self.used = used

    def table(self, name: str):
        return _Table(name, self.rows, self.used)


def _client(rows: list[dict], used: int = 2) -> TestClient:
    app.dependency_overrides[get_db] = lambda: _Db(rows, used)
    app.dependency_overrides[verify_token] = lambda: "user-1"
    return TestClient(app)


def teardown_function():
    app.dependency_overrides.clear()


def test_conversation_item_uses_metadata_title_and_ratio_conversion():
    item = conversation_item(ROW_2)
    assert item.title == "You spoke for most of the conversation"
    assert item.talk_listen_percent == 67
    assert item.tone == "coral"


def test_build_progress_groups_daily_minutes_and_fillers():
    progress = build_progress([ROW_1, ROW_2], max_weeks=1)
    week = progress.weeks[0]
    assert week.conversation_count == 2
    assert week.daily_minutes[1] == 20.0
    assert week.daily_minutes[2] == 40.0
    assert week.daily_questions[1] == 9
    assert week.daily_interruptions[2] == 3
    assert week.total_questions == 11
    assert week.average_questions == 5.5
    assert week.conversations[0].title == "You spoke for most of the conversation"
    assert any(item.phrase == "you know" for item in week.top_fillers)


def test_build_profile_summary_rolls_up_usage():
    summary = build_profile_summary([ROW_1, ROW_2], {"used_this_month": 2, "remaining": 3, "resets_at": "2026-08-01T00:00:00+00:00"})
    assert summary.total_conversations == 2
    assert summary.total_minutes == 60.0
    assert summary.average_questions == 5.5
    assert summary.used_this_month == 2


def test_debrief_detail_returns_owned_row():
    r = _client([ROW_1]).get("/debriefs/00000000-0000-0000-0000-000000000101")
    assert r.status_code == 200
    assert r.json()["id"] == ROW_1["id"]


def test_debrief_detail_404s_missing_row():
    r = _client([]).get("/debriefs/00000000-0000-0000-0000-000000000101")
    assert r.status_code == 404


def test_profile_summary_endpoint():
    r = _client([ROW_1, ROW_2], used=4).get("/profile/summary")
    assert r.status_code == 200
    assert r.json()["total_conversations"] == 2
    assert r.json()["remaining"] == 1


def test_progress_endpoint():
    r = _client([ROW_1, ROW_2]).get("/analytics/progress?weeks=1")
    assert r.status_code == 200
    body = r.json()
    assert body["weeks"][0]["conversation_count"] == 2
    assert body["weeks"][0]["conversations"][0]["id"] == ROW_2["id"]


def test_reflect_fallback_without_model(monkeypatch):
    monkeypatch.setattr("app.open_model.settings.open_model_api_key", "")
    monkeypatch.setattr("app.open_model.settings.hf_token", "")
    monkeypatch.setattr("app.open_model.settings.huggingface_api_key", "")
    monkeypatch.setattr("app.open_model.settings.open_model_allow_anonymous", False)
    r = _client([ROW_1]).post("/reflect", json={"conversation_id": ROW_1["id"], "prompt": "How were my questions?"})
    assert r.status_code == 200
    assert r.json()["used_model"] is False
    assert "9 questions" in r.json()["reply"]


def test_reflect_uses_open_model_when_configured(monkeypatch):
    monkeypatch.setattr("app.open_model.settings.open_model_api_key", "hf-test")
    monkeypatch.setattr("app.open_model.settings.hf_token", "")
    monkeypatch.setattr("app.open_model.settings.huggingface_api_key", "")
    monkeypatch.setattr("app.open_model.settings.open_model_name", "Qwen/Qwen2.5-7B-Instruct-1M:fastest")
    monkeypatch.setattr("app.open_model.settings.open_model_allow_anonymous", False)
    response = _HttpResponse(
        200,
        {"choices": [{"message": {"content": "An open model reply."}}]},
    )
    with patch("app.open_model.httpx.post", return_value=response) as post:
        r = _client([ROW_1]).post(
            "/reflect",
            json={
                "conversation_id": ROW_1["id"],
                "prompt": "What worked?",
                "messages": [{"role": "user", "content": "Can you help me reflect?"}],
            },
        )

    assert r.status_code == 200
    assert r.json() == {"reply": "An open model reply.", "used_model": True}
    _args, kwargs = post.call_args
    assert kwargs["headers"]["Authorization"] == "Bearer hf-test"
    assert kwargs["json"]["model"] == "Qwen/Qwen2.5-7B-Instruct-1M:fastest"
    assert kwargs["json"]["messages"][0]["role"] == "system"
    assert "Coffee with Maya" in kwargs["json"]["messages"][-1]["content"]
    assert "Honestly, what was that like?" not in kwargs["json"]["messages"][-1]["content"]


def test_reflect_uses_anonymous_open_model_without_key(monkeypatch):
    monkeypatch.setattr("app.open_model.settings.open_model_api_key", "")
    monkeypatch.setattr("app.open_model.settings.hf_token", "")
    monkeypatch.setattr("app.open_model.settings.huggingface_api_key", "")
    monkeypatch.setattr("app.open_model.settings.open_model_allow_anonymous", True)
    monkeypatch.setattr("app.open_model.settings.anonymous_open_model_base_url", "https://text.pollinations.ai")
    monkeypatch.setattr("app.open_model.settings.anonymous_open_model_name", "openai-fast")
    response = _HttpResponse(
        200,
        {"choices": [{"message": {"content": "A keyless open model reply."}}]},
    )
    with patch("app.open_model.httpx.post", return_value=response) as post:
        r = _client([ROW_1]).post("/reflect", json={"conversation_id": ROW_1["id"], "prompt": "What worked?"})

    assert r.status_code == 200
    assert r.json() == {"reply": "A keyless open model reply.", "used_model": True}
    args, kwargs = post.call_args
    assert args[0] == "https://text.pollinations.ai/openai"
    assert "Authorization" not in kwargs["headers"]
    assert kwargs["json"]["model"] == "openai-fast"


def test_reflect_falls_back_when_open_model_errors(monkeypatch):
    monkeypatch.setattr("app.open_model.settings.open_model_api_key", "hf-test")
    monkeypatch.setattr("app.open_model.settings.hf_token", "")
    monkeypatch.setattr("app.open_model.settings.huggingface_api_key", "")
    monkeypatch.setattr("app.open_model.settings.open_model_allow_anonymous", False)
    with patch("app.open_model.httpx.post", return_value=_HttpResponse(500, {})):
        r = _client([ROW_1]).post("/reflect", json={"conversation_id": ROW_1["id"], "prompt": "How were my questions?"})

    assert r.status_code == 200
    assert r.json()["used_model"] is False
    assert "9 questions" in r.json()["reply"]


def test_fallback_reflection_handles_empty_context():
    reply = fallback_reflection([], "What worked?")
    assert "do not have a conversation" in reply
