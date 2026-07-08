from __future__ import annotations

import math

import numpy as np

from app.pipeline.vad import Segment


def _log_energy(segment: Segment) -> float:
    return math.log(max(float(segment.energy), 1e-8))


def _energy_split_threshold(segments: list[Segment]) -> float | None:
    if len(segments) < 2:
        return None

    values = np.array([_log_energy(segment) for segment in segments], dtype=np.float64)
    low = float(np.percentile(values, 25))
    high = float(np.percentile(values, 75))
    if high <= low:
        return None

    for _ in range(8):
        low_group = values[np.abs(values - low) <= np.abs(values - high)]
        high_group = values[np.abs(values - high) < np.abs(values - low)]
        if len(low_group) == 0 or len(high_group) == 0:
            return None
        next_low = float(low_group.mean())
        next_high = float(high_group.mean())
        if abs(next_low - low) < 1e-4 and abs(next_high - high) < 1e-4:
            break
        low, high = next_low, next_high

    # Require a meaningful energy gap so a single-speaker recording is not split.
    if math.exp(abs(high - low)) < 1.35:
        return None
    return (low + high) / 2


def filter_user_segments(segments: list[Segment]) -> list[Segment]:
    if not segments:
        return []
    threshold = _energy_split_threshold(segments)
    if threshold is None:
        return list(segments)

    user_segments = [segment for segment in segments if _log_energy(segment) >= threshold]
    if not user_segments:
        return [max(segments, key=lambda segment: segment.energy)]
    return user_segments
