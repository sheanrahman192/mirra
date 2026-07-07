from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, time, timezone, timedelta
import re
from typing import Any
from uuid import UUID

from app.models.dashboard import ConversationListItem, FillerCount, ProfileSummary, ProgressResponse, ProgressWeek

FILLER_PHRASES = ("you know", "i mean", "kind of", "sort of", "like", "honestly", "actually", "right")


def _parse_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        dt = value
    else:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _stats(row: dict) -> dict:
    value = row.get("stats")
    return value if isinstance(value, dict) else {}


def _metadata(row: dict) -> dict:
    value = _stats(row).get("metadata")
    return value if isinstance(value, dict) else {}


def title_for(row: dict) -> str:
    title = _metadata(row).get("title")
    if isinstance(title, str) and title.strip():
        return title.strip()
    observation = str(row.get("observation") or "").strip()
    return re.split(r"[.!?]", observation)[0].strip() or "Conversation debrief"


def _note_for(row: dict) -> str:
    return str(row.get("thing_to_try_next") or row.get("pattern_to_reduce") or "").strip()


def _duration(row: dict) -> float:
    return round(float(_stats(row).get("session_duration_minutes") or 0), 3)


def _question_count(row: dict) -> int:
    return int(_stats(row).get("question_count") or 0)


def _interruption_count(row: dict) -> int:
    return int(_stats(row).get("interruption_count") or 0)


def _wpm(row: dict) -> float:
    return float(_stats(row).get("estimated_wpm") or 0)


def talk_listen_percent(row: dict) -> int:
    raw = float(_stats(row).get("talk_listen_ratio") or 0)
    if raw <= 0:
        return 0
    share = raw if raw <= 1 else raw / (1 + raw)
    return max(0, min(100, round(share * 100)))


def tone_for(row: dict) -> str:
    talk_percent = talk_listen_percent(row)
    if talk_percent > 65:
        return "coral"
    if _question_count(row) >= 8:
        return "sage"
    if _interruption_count(row) > 2:
        return "terracotta"
    return "lavender"


def conversation_item(row: dict) -> ConversationListItem:
    return ConversationListItem(
        id=UUID(str(row["id"])),
        title=title_for(row),
        created_at=_parse_datetime(row["created_at"]),
        duration_minutes=_duration(row),
        talk_listen_percent=talk_listen_percent(row),
        question_count=_question_count(row),
        interruption_count=_interruption_count(row),
        tone=tone_for(row),
        note=_note_for(row),
    )


def _week_start(dt: datetime) -> datetime:
    day = dt.astimezone(timezone.utc).date()
    start_date = day - timedelta(days=day.weekday())
    return datetime.combine(start_date, time.min, tzinfo=timezone.utc)


def _date_label(dt: datetime) -> str:
    return f"{dt.strftime('%b')} {dt.day}"


def _week_label(start: datetime) -> str:
    end = start + timedelta(days=6)
    return f"{_date_label(start)} - {_date_label(end)}"


def _top_fillers(rows: list[dict]) -> list[FillerCount]:
    counts: Counter[str] = Counter()
    transcript = "\n".join(str(row.get("transcript") or "").lower() for row in rows)
    for phrase in FILLER_PHRASES:
        counts[phrase] = len(re.findall(rf"\b{re.escape(phrase)}\b", transcript))
    return [FillerCount(phrase=phrase, count=count) for phrase, count in counts.most_common(5) if count > 0]


def _wins(rows: list[dict], talk_percent: int, average_questions: float, interruptions: int) -> list[str]:
    wins: list[str] = []
    if 40 <= talk_percent <= 60:
        wins.append(f"Talk share landed near balance at {talk_percent}%.")
    if average_questions >= 8:
        wins.append(f"You averaged {average_questions:.1f} questions per conversation.")
    if rows and interruptions <= max(1, len(rows)):
        wins.append("Interruptions stayed comparatively low.")
    return wins[:3]


def _nudges(rows: list[dict], talk_percent: int, average_questions: float, interruptions: int, fillers: list[FillerCount]) -> list[str]:
    nudges: list[str] = []
    if talk_percent > 65:
        nudges.append(f"You spoke {talk_percent}% of the time; try leaving a little more room.")
    if average_questions < 3 and rows:
        nudges.append("Question count was low; one more open question could invite more detail.")
    if interruptions >= max(3, len(rows) * 2):
        nudges.append("Interruptions are clustering enough to watch for the urge to jump in.")
    if fillers and sum(item.count for item in fillers) >= 10:
        nudges.append("Filler words showed up often enough to notice without judging.")
    return nudges[:3]


def build_progress(rows: list[dict], max_weeks: int = 8) -> ProgressResponse:
    now = datetime.now(timezone.utc)
    grouped: dict[datetime, list[dict]] = defaultdict(list)
    for row in rows:
        grouped[_week_start(_parse_datetime(row["created_at"]))].append(row)

    current_start = _week_start(now)
    starts = sorted(set(grouped.keys()) | {current_start}, reverse=True)[:max_weeks]
    weeks: list[ProgressWeek] = []
    for start in starts:
        week_rows = sorted(grouped.get(start, []), key=lambda row: _parse_datetime(row["created_at"]), reverse=True)
        daily = [0.0] * 7
        daily_questions = [0] * 7
        daily_interruptions = [0] * 7
        for row in week_rows:
            dt = _parse_datetime(row["created_at"])
            daily[dt.weekday()] += _duration(row)
            daily_questions[dt.weekday()] += _question_count(row)
            daily_interruptions[dt.weekday()] += _interruption_count(row)

        total_minutes = round(sum(daily), 3)
        conv_count = len(week_rows)
        total_questions = sum(_question_count(row) for row in week_rows)
        interruptions = sum(_interruption_count(row) for row in week_rows)
        talk_percent = round(sum(talk_listen_percent(row) for row in week_rows) / conv_count) if conv_count else 0
        average_questions = round(total_questions / conv_count, 1) if conv_count else 0.0
        average_wpm = round(sum(_wpm(row) for row in week_rows) / conv_count, 1) if conv_count else 0.0
        fillers = _top_fillers(week_rows)
        weeks.append(
            ProgressWeek(
                week_key=start.date().isoformat(),
                label="This week" if start == current_start else _week_label(start),
                starts_at=start,
                ends_at=start + timedelta(days=6, hours=23, minutes=59, seconds=59),
                conversation_count=conv_count,
                total_minutes=total_minutes,
                daily_minutes=[round(value, 3) for value in daily],
                daily_questions=daily_questions,
                daily_interruptions=daily_interruptions,
                average_session_minutes=round(total_minutes / conv_count, 1) if conv_count else 0.0,
                talk_listen_percent=talk_percent,
                average_questions=average_questions,
                total_questions=total_questions,
                interruption_count=interruptions,
                average_wpm=average_wpm,
                top_fillers=fillers,
                wins=_wins(week_rows, talk_percent, average_questions, interruptions),
                nudges=_nudges(week_rows, talk_percent, average_questions, interruptions, fillers),
                conversations=[conversation_item(row) for row in week_rows],
            )
        )

    current_index = next((idx for idx, week in enumerate(weeks) if week.week_key == current_start.date().isoformat()), 0)
    return ProgressResponse(generated_at=now, current_week_index=current_index, weeks=weeks)


def build_profile_summary(rows: list[dict], usage: dict) -> ProfileSummary:
    total_conversations = len(rows)
    total_minutes = round(sum(_duration(row) for row in rows), 3)
    total_questions = sum(_question_count(row) for row in rows)
    talk_percent = round(sum(talk_listen_percent(row) for row in rows) / total_conversations) if rows else 0
    return ProfileSummary(
        total_conversations=total_conversations,
        total_minutes=total_minutes,
        average_questions=round(total_questions / total_conversations, 1) if total_conversations else 0.0,
        talk_listen_percent=talk_percent,
        used_this_month=int(usage["used_this_month"]),
        remaining=int(usage["remaining"]),
        resets_at=_parse_datetime(usage["resets_at"]),
    )


def fallback_reflection(rows: list[dict], prompt: str) -> str:
    if not rows:
        return "I do not have a conversation to reference yet, but I can still help you reflect. What moment from the conversation are you most curious about?"

    row = rows[0]
    title = title_for(row)
    talk_percent = talk_listen_percent(row)
    questions = _question_count(row)
    interruptions = _interruption_count(row)
    if "question" in prompt.lower():
        return f"In {title}, you asked {questions} questions. A useful next step is to make the first one open-ended, then leave a beat for the other person to find their words."
    if "interrupt" in prompt.lower():
        return f"In {title}, I see {interruptions} interruptions estimated. Notice whether they happen when you are excited, anxious, or trying to help."
    return f"In {title}, your talk share was about {talk_percent}%. The pattern to watch is not good or bad by itself; it is whether the other person had enough room to unfold."
