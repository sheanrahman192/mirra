from datetime import datetime, timezone

from fastapi import HTTPException
from supabase import Client

from app.config import settings


def _month_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _resets_at() -> str:
    now = datetime.now(timezone.utc)
    year, month = (now.year + 1, 1) if now.month == 12 else (now.year, now.month + 1)
    return datetime(year, month, 1, tzinfo=timezone.utc).isoformat()


def get_usage(db: Client, user_id: str) -> dict:
    month = _month_key()
    row = (
        db.table("debrief_usage")
        .select("count")
        .eq("user_id", user_id)
        .eq("month_key", month)
        .maybe_single()
        .execute()
    )
    used = row.data["count"] if row.data else 0
    return {
        "used_this_month": used,
        "remaining": max(0, settings.free_tier_cap - used),
        "resets_at": _resets_at(),
    }


def check_and_increment(db: Client, user_id: str) -> None:
    month = _month_key()
    row = (
        db.table("debrief_usage")
        .select("count")
        .eq("user_id", user_id)
        .eq("month_key", month)
        .maybe_single()
        .execute()
    )
    used = row.data["count"] if row.data else 0
    if used >= settings.free_tier_cap:
        raise HTTPException(status_code=402, detail="Monthly debrief limit reached")
    # ponytail: non-atomic read-modify-write; race window acceptable at 5/month cap; use DB-level increment if throughput matters
    if row.data:
        (
            db.table("debrief_usage")
            .update({"count": used + 1})
            .eq("user_id", user_id)
            .eq("month_key", month)
            .execute()
        )
    else:
        db.table("debrief_usage").insert({"user_id": user_id, "month_key": month, "count": 1}).execute()
