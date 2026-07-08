import io
import tempfile

import librosa
import numpy as np
import soundfile as sf

from app.pipeline.claude import analyze
from app.pipeline.prosody import compute_stats
from app.pipeline.speaker import filter_user_segments
from app.pipeline.vad import detect_segments
from app.pipeline.whisper import transcribe

ANALYSIS_SAMPLE_RATE = 16000
CONTENT_TYPE_SUFFIXES = {
    "audio/aac": ".aac",
    "audio/mp4": ".m4a",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/x-m4a": ".m4a",
    "audio/x-wav": ".wav",
    "audio/webm": ".webm",
}


def _decode_audio(audio_bytes: bytes, content_type: str | None = None) -> tuple[np.ndarray, int]:
    try:
        audio, sample_rate = sf.read(io.BytesIO(audio_bytes), dtype="float32", always_2d=False)
    except Exception as soundfile_error:
        try:
            suffix = CONTENT_TYPE_SUFFIXES.get((content_type or "").lower(), ".audio")
            with tempfile.NamedTemporaryFile(suffix=suffix) as tmp:
                tmp.write(audio_bytes)
                tmp.flush()
                audio, sample_rate = librosa.load(tmp.name, sr=None, mono=False)
        except Exception as librosa_error:
            raise ValueError("Could not decode audio") from librosa_error
        if audio.size == 0:
            raise ValueError("Could not decode audio") from soundfile_error

    audio = np.asarray(audio, dtype=np.float32)
    if audio.ndim > 1:
        audio = audio.mean(axis=0 if audio.shape[0] < audio.shape[-1] else 1)
    audio = np.nan_to_num(audio, nan=0.0, posinf=0.0, neginf=0.0).astype(np.float32)
    if len(audio) == 0 or sample_rate <= 0:
        raise ValueError("Could not decode audio")
    return audio, int(sample_rate)


def _analysis_audio(audio: np.ndarray, sample_rate: int) -> tuple[np.ndarray, int]:
    if sample_rate == ANALYSIS_SAMPLE_RATE:
        return audio.astype(np.float32), sample_rate
    resampled = librosa.resample(audio.astype(np.float32), orig_sr=sample_rate, target_sr=ANALYSIS_SAMPLE_RATE)
    return resampled.astype(np.float32), ANALYSIS_SAMPLE_RATE


def run(audio_bytes: bytes, content_type: str | None = None) -> dict:
    original_audio, original_sr = _decode_audio(audio_bytes, content_type)
    audio, sr = _analysis_audio(original_audio, original_sr)
    total_seconds = len(audio) / sr

    all_segs = detect_segments(audio, sr)
    user_segs = filter_user_segments(all_segs)
    transcript = transcribe(audio, sr, user_segs)
    stats = compute_stats(all_segs, user_segs, transcript, total_seconds, audio=audio, sample_rate=sr)
    coaching = analyze(transcript, stats)

    return {**coaching, "stats": stats, "transcript": transcript}
