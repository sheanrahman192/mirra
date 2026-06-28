import io

import numpy as np
import soundfile as sf

from app.pipeline.claude import analyze
from app.pipeline.prosody import compute_stats
from app.pipeline.speaker import filter_user_segments
from app.pipeline.vad import detect_segments
from app.pipeline.whisper import transcribe


def run(audio_bytes: bytes) -> dict:
    audio, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32", always_2d=False)
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    total_seconds = len(audio) / sr

    all_segs = detect_segments(audio, sr)
    user_segs = filter_user_segments(all_segs)
    transcript = transcribe(audio, sr, user_segs)
    stats = compute_stats(all_segs, user_segs, transcript, total_seconds)
    coaching = analyze(transcript, stats)

    return {**coaching, "stats": stats, "transcript": transcript}
