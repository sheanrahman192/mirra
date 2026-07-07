from __future__ import annotations

from typing import Any

import httpx

from app.config import settings
from app.dashboard import talk_listen_percent, title_for
from app.models.dashboard import ReflectRequest

_SYSTEM_PROMPT = (
    "You are Mirra, a warm, concise conversation coach. Help the user reflect on a real "
    "conversation with kindness and specificity. Use the supplied debrief context when it is "
    "available, and say when there is not enough context. Do not diagnose, moralize, or invent "
    "details. Keep the reply to 1-3 short sentences and ask one gentle follow-up question when "
    "it would help the user continue."
)


def _stats(row: dict) -> dict:
    value = row.get("stats")
    return value if isinstance(value, dict) else {}


def _truncate(value: Any, limit: int) -> str:
    text = str(value or "").strip()
    if len(text) <= limit:
        return text
    return f"{text[:limit].rstrip()}..."


def _debrief_context(row: dict) -> str:
    stats = _stats(row)
    pieces = [
        f"Title: {title_for(row)}",
        f"Observation: {_truncate(row.get('observation'), 500)}",
        f"Pattern to reduce: {_truncate(row.get('pattern_to_reduce'), 350)}",
        f"Thing to try next: {_truncate(row.get('thing_to_try_next'), 350)}",
        f"Talk share: {talk_listen_percent(row)}%",
        f"Questions: {int(stats.get('question_count') or 0)}",
        f"Interruptions: {int(stats.get('interruption_count') or 0)}",
    ]
    transcript = _truncate(row.get("transcript"), 1200)
    if transcript:
        pieces.append(f"Transcript excerpt: {transcript}")
    return "\n".join(pieces)


def build_reflection_messages(rows: list[dict], payload: ReflectRequest) -> list[dict[str, str]]:
    messages = [{"role": "system", "content": _SYSTEM_PROMPT}]
    for message in payload.messages[-12:]:
        if message.role not in {"assistant", "user"}:
            continue
        content = message.content.strip()
        if content:
            messages.append({"role": message.role, "content": content})

    if rows:
        context = "\n\n".join(_debrief_context(row) for row in rows[:3])
    else:
        context = "No saved debrief is available yet."

    messages.append(
        {
            "role": "user",
            "content": f"Debrief context:\n{context}\n\nUser prompt:\n{payload.prompt.strip()}",
        }
    )
    return messages


def generate_open_model_reflection(rows: list[dict], payload: ReflectRequest) -> str | None:
    token = settings.open_model_token
    if not token:
        return None

    try:
        response = httpx.post(
            f"{settings.open_model_base_url.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.open_model_name,
                "messages": build_reflection_messages(rows, payload),
                "max_tokens": settings.open_model_max_tokens,
                "temperature": settings.open_model_temperature,
            },
            timeout=settings.open_model_timeout_seconds,
        )
        if response.status_code >= 400:
            return None
        data = response.json()
        text = data["choices"][0]["message"]["content"]
    except Exception:
        return None

    return text.strip() if isinstance(text, str) and text.strip() else None
