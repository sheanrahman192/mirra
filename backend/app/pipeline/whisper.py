import io

import numpy as np
import soundfile as sf
from openai import OpenAI

from app.config import settings
from app.pipeline.vad import Segment


def transcribe(audio: np.ndarray, sample_rate: int, segments: list[Segment]) -> str:
    if not segments:
        return ""
    pad = np.zeros(int(0.2 * sample_rate), dtype=np.float32)
    chunks = []
    for seg in segments:
        chunks.append(audio[int(seg.start * sample_rate) : int(seg.end * sample_rate)])
        chunks.append(pad)
    buf = io.BytesIO()
    sf.write(buf, np.concatenate(chunks), sample_rate, format="WAV")
    buf.seek(0)
    buf.name = "audio.wav"
    return OpenAI(api_key=settings.openai_api_key).audio.transcriptions.create(model="whisper-1", file=buf).text
