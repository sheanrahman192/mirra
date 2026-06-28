from app.pipeline.vad import Segment

# ponytail: librosa pitch/RMS skipped — not in ConversationStats schema; add if Claude needs richer signal


def compute_stats(
    all_segments: list[Segment],
    user_segments: list[Segment],
    transcript: str,
    total_seconds: float,
) -> dict:
    user_speech = sum(s.end - s.start for s in user_segments)
    other_speech = max(0.0, sum(s.end - s.start for s in all_segments) - user_speech)
    return {
        "talk_listen_ratio": round(user_speech / other_speech, 3) if other_speech > 0 else 99.0,
        "question_count": transcript.count("?"),
        "interruption_count": 0,  # ponytail: needs diarization; placeholder for v2
        "session_duration_minutes": round(total_seconds / 60, 3),
        "user_speech_duration_minutes": round(user_speech / 60, 3),
        "estimated_wpm": round(len(transcript.split()) / (user_speech / 60), 1) if user_speech > 0 else 0.0,
    }
