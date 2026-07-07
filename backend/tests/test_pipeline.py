import io
from unittest.mock import MagicMock, patch

import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient

from app.auth import verify_token
from app.db import get_db
from app.main import app
from app.pipeline.vad import Segment
from app.pipeline.speaker import filter_user_segments
from app.pipeline.prosody import compute_stats

SAMPLE_DEBRIEF = {
    "id": "00000000-0000-0000-0000-000000000001",
    "session_id": "session-1",
    "user_id": "user-1",
    "created_at": "2026-06-27T00:00:00+00:00",
    "observation": "You asked great questions.",
    "pattern_to_reduce": "Interrupting before the other person finishes.",
    "thing_to_try_next": "Wait 2 seconds before responding.",
    "stats": {
        "talk_listen_ratio": 0.6,
        "question_count": 3,
        "interruption_count": 0,
        "session_duration_minutes": 10.0,
        "user_speech_duration_minutes": 6.0,
        "estimated_wpm": 130.0,
    },
    "transcript": "Hello world?",
}


def _fake_wav() -> bytes:
    buf = io.BytesIO()
    sf.write(buf, np.zeros(16000, dtype=np.float32), 16000, format="WAV")
    buf.seek(0)
    return buf.read()


def _db_for_sessions(under_cap: bool = True) -> MagicMock:
    db = MagicMock()
    usage_result = MagicMock()
    usage_result.data = None if under_cap else {"count": 5}
    db.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value = usage_result
    db.table.return_value.insert.return_value.execute.return_value.data = [SAMPLE_DEBRIEF]
    return db


def teardown_function():
    app.dependency_overrides.clear()


# --- pure function tests ---

def test_filter_user_segments_top_quartile():
    segs = [Segment(start=float(i), end=float(i + 1), energy=float(i)) for i in range(4)]
    result = filter_user_segments(segs)
    assert all(s.energy >= 3.0 for s in result)


def test_filter_user_segments_empty():
    assert filter_user_segments([]) == []


def test_compute_stats_basic():
    all_segs = [Segment(0, 10, 0.5), Segment(20, 30, 0.5)]
    user_segs = [Segment(0, 10, 0.5)]
    stats = compute_stats(all_segs, user_segs, "Hello world? Yes.", 60.0)
    assert stats["talk_listen_ratio"] == 1.0
    assert stats["question_count"] == 1
    assert stats["session_duration_minutes"] == 1.0
    assert stats["interruption_count"] == 0


def test_compute_stats_no_other_speech():
    segs = [Segment(0, 10, 0.5)]
    stats = compute_stats(segs, segs, "words", 60.0)
    assert stats["talk_listen_ratio"] == 99.0


# --- mocked I/O tests ---

@patch("app.pipeline.whisper.OpenAI")
def test_transcribe(mock_openai):
    mock_openai.return_value.audio.transcriptions.create.return_value.text = "hello world"
    from app.pipeline.whisper import transcribe
    audio = np.zeros(16000, dtype=np.float32)
    result = transcribe(audio, 16000, [Segment(0, 1, 0.5)])
    assert result == "hello world"


@patch("app.pipeline.claude.anthropic.Anthropic")
def test_analyze(mock_anthropic):
    block = MagicMock()
    block.type = "tool_use"
    block.name = "debrief_card"
    block.input = {"observation": "x", "pattern_to_reduce": "y", "thing_to_try_next": "z"}
    mock_anthropic.return_value.messages.create.return_value.content = [block]
    from app.pipeline.claude import analyze
    result = analyze("transcript", {})
    assert result == {"observation": "x", "pattern_to_reduce": "y", "thing_to_try_next": "z"}


# --- endpoint tests ---

@patch("app.main.coordinator.run")
def test_post_sessions_success(mock_run):
    mock_run.return_value = {
        "observation": SAMPLE_DEBRIEF["observation"],
        "pattern_to_reduce": SAMPLE_DEBRIEF["pattern_to_reduce"],
        "thing_to_try_next": SAMPLE_DEBRIEF["thing_to_try_next"],
        "stats": SAMPLE_DEBRIEF["stats"],
        "transcript": SAMPLE_DEBRIEF["transcript"],
    }
    db = _db_for_sessions(under_cap=True)
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[verify_token] = lambda: "user-1"
    r = TestClient(app).post("/sessions", files={"audio": ("test.wav", _fake_wav(), "audio/wav")})
    assert r.status_code == 200
    data = r.json()
    assert "debrief" in data
    assert "used_this_month" in data
    assert "remaining" in data
    assert data["debrief"]["observation"] == SAMPLE_DEBRIEF["observation"]
    insert_payload = db.table.return_value.insert.call_args.args[0]
    assert "session_id" in insert_payload


@patch("app.main.coordinator.run")
def test_post_sessions_rejects_unsupported_audio_type(mock_run):
    app.dependency_overrides[get_db] = lambda: _db_for_sessions(under_cap=True)
    app.dependency_overrides[verify_token] = lambda: "user-1"
    r = TestClient(app).post("/sessions", files={"audio": ("test.txt", b"hello", "text/plain")})
    assert r.status_code == 415
    mock_run.assert_not_called()


@patch("app.main.coordinator.run")
def test_post_sessions_rejects_oversized_audio(mock_run):
    app.dependency_overrides[get_db] = lambda: _db_for_sessions(under_cap=True)
    app.dependency_overrides[verify_token] = lambda: "user-1"
    oversized = b"0" * (25 * 1024 * 1024 + 1)
    r = TestClient(app).post("/sessions", files={"audio": ("test.wav", oversized, "audio/wav")})
    assert r.status_code == 413
    mock_run.assert_not_called()


@patch("app.main.coordinator.run")
def test_post_sessions_at_cap_returns_402(mock_run):
    app.dependency_overrides[get_db] = lambda: _db_for_sessions(under_cap=False)
    app.dependency_overrides[verify_token] = lambda: "user-1"
    r = TestClient(app).post("/sessions", files={"audio": ("test.wav", _fake_wav(), "audio/wav")})
    assert r.status_code == 402
    mock_run.assert_not_called()
