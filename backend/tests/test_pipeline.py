import io
from unittest.mock import MagicMock, patch

import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient

from app.auth import verify_token
from app.db import get_db
from app.main import app
from app.models.settings import UserSettings
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


def _fake_wav(sample_rate: int = 16000, stereo: bool = False) -> bytes:
    buf = io.BytesIO()
    audio = np.zeros(sample_rate, dtype=np.float32)
    if stereo:
        audio = np.stack([audio, audio], axis=1)
    sf.write(buf, audio, sample_rate, format="WAV")
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

def test_filter_user_segments_uses_high_energy_cluster():
    energies = [0.10, 0.12, 0.80, 0.90]
    segs = [Segment(start=float(i), end=float(i + 1), energy=energy) for i, energy in enumerate(energies)]
    result = filter_user_segments(segs)
    assert [s.energy for s in result] == [0.8, 0.9]


def test_filter_user_segments_keeps_single_voice_when_energy_is_close():
    segs = [Segment(start=float(i), end=float(i + 1), energy=0.45 + i * 0.02) for i in range(4)]
    result = filter_user_segments(segs)
    assert result == segs


def test_filter_user_segments_empty():
    assert filter_user_segments([]) == []


def test_compute_stats_basic():
    all_segs = [Segment(0, 10, 0.5), Segment(20, 30, 0.5)]
    user_segs = [Segment(0, 10, 0.5)]
    stats = compute_stats(all_segs, user_segs, "Hello world? Yes.", 60.0)
    assert stats["talk_listen_ratio"] == 1.0
    assert stats["question_count"] == 1
    assert stats["open_question_count"] == 0
    assert stats["closed_question_count"] == 1
    assert stats["session_duration_minutes"] == 1.0
    assert stats["interruption_count"] == 0
    assert stats["average_turn_offset_ms"] == 10000
    assert stats["total_word_count"] == 3
    assert stats["unique_word_count"] == 3


def test_compute_stats_no_other_speech():
    segs = [Segment(0, 10, 0.5)]
    stats = compute_stats(segs, segs, "words", 60.0)
    assert stats["talk_listen_ratio"] == 99.0


def test_compute_stats_adds_voice_analysis_from_audio():
    sr = 16000
    timeline = np.linspace(0, 3, sr * 3, endpoint=False)
    audio = (0.08 * np.sin(2 * np.pi * 180 * timeline)).astype(np.float32)
    all_segs = [Segment(0, 1, 0.08), Segment(1.05, 2, 0.04), Segment(2.5, 3, 0.09)]
    user_segs = [all_segs[0], all_segs[2]]
    stats = compute_stats(all_segs, user_segs, "What changed? Did that help? like actually", 3.0, audio=audio, sample_rate=sr)
    assert stats["question_count"] == 2
    assert stats["open_question_count"] == 1
    assert stats["closed_question_count"] == 1
    assert stats["interruption_count"] == 1
    assert stats["average_turn_offset_ms"] == 275
    assert len(stats["energy_axes"]) == 3
    assert len(stats["energy_series_user"]) == 16
    assert stats["energy_score"] > 0
    assert stats["lsm_score"] > 0
    assert stats["filler_counts"][0] == {"phrase": "like", "count": 1}


@patch("app.pipeline.coordinator.analyze")
@patch("app.pipeline.coordinator.transcribe")
@patch("app.pipeline.coordinator.filter_user_segments")
@patch("app.pipeline.coordinator.detect_segments")
def test_coordinator_resamples_stereo_audio_for_voice_analysis(mock_detect, mock_filter, mock_transcribe, mock_analyze):
    from app.pipeline import coordinator

    mock_detect.return_value = [Segment(0, 0.5, 0.1)]
    mock_filter.return_value = [Segment(0, 0.5, 0.1)]
    mock_transcribe.return_value = "What changed?"
    mock_analyze.return_value = {"observation": "x", "pattern_to_reduce": "y", "thing_to_try_next": "z"}

    result = coordinator.run(_fake_wav(sample_rate=44100, stereo=True))

    detected_audio, detected_sr = mock_detect.call_args.args
    transcribed_audio, transcribed_sr, _segments = mock_transcribe.call_args.args
    assert detected_sr == 16000
    assert transcribed_sr == 16000
    assert detected_audio.ndim == 1
    assert transcribed_audio.ndim == 1
    assert result["stats"]["session_duration_minutes"] > 0


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
    assert mock_run.call_args.kwargs["content_type"] == "audio/wav"


@patch("app.main.fetch_user_settings")
@patch("app.main.coordinator.run")
def test_post_sessions_respects_transcript_setting(mock_run, mock_settings):
    mock_settings.return_value = UserSettings(save_transcripts=False)
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
    insert_payload = db.table.return_value.insert.call_args.args[0]
    assert insert_payload["transcript"] is None


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


@patch("app.main.coordinator.run", side_effect=ValueError("bad audio"))
def test_post_sessions_returns_422_when_audio_cannot_be_decoded(mock_run):
    app.dependency_overrides[get_db] = lambda: _db_for_sessions(under_cap=True)
    app.dependency_overrides[verify_token] = lambda: "user-1"
    r = TestClient(app).post("/sessions", files={"audio": ("test.wav", b"not really audio", "audio/wav")})
    assert r.status_code == 422
    assert r.json()["detail"] == "Could not decode audio"
    mock_run.assert_called_once()


@patch("app.main.coordinator.run")
def test_post_sessions_at_cap_returns_402(mock_run):
    app.dependency_overrides[get_db] = lambda: _db_for_sessions(under_cap=False)
    app.dependency_overrides[verify_token] = lambda: "user-1"
    r = TestClient(app).post("/sessions", files={"audio": ("test.wav", _fake_wav(), "audio/wav")})
    assert r.status_code == 402
    mock_run.assert_not_called()
