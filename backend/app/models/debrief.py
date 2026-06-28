from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConversationStats(BaseModel):
    talk_listen_ratio: float
    question_count: int
    interruption_count: int
    session_duration_minutes: float
    user_speech_duration_minutes: float
    estimated_wpm: float


class Debrief(BaseModel):
    id: UUID
    user_id: str
    created_at: datetime
    observation: str
    pattern_to_reduce: str
    thing_to_try_next: str
    stats: ConversationStats
    transcript: str | None = None


class SessionResponse(BaseModel):
    debrief: Debrief
    used_this_month: int
    remaining: int
