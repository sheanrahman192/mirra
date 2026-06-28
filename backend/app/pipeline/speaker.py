import numpy as np

from app.pipeline.vad import Segment


def filter_user_segments(segments: list[Segment]) -> list[Segment]:
    if not segments:
        return []
    # ponytail: energy-percentile heuristic; top-quartile = user (closer to mic). Replace with diarization model in v2.
    threshold = np.percentile([s.energy for s in segments], 75)
    return [s for s in segments if s.energy >= threshold]
