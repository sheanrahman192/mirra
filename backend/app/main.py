from fastapi import Depends, FastAPI, File, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client

from app.auth import verify_token
from app.config import settings
from app.db import get_db
from app.models.debrief import Debrief, SessionResponse
from app.pipeline import coordinator
from app.usage import check_and_increment, get_usage

app = FastAPI(title="Mirra Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/usage")
def usage(user_id: str = Depends(verify_token), db: Client = Depends(get_db)):
    return get_usage(db, user_id)


@app.post("/sessions", response_model=SessionResponse)
def create_session(
    audio: UploadFile = File(...),
    user_id: str = Depends(verify_token),
    db: Client = Depends(get_db),
):
    # ponytail: charged on attempt not success; race window OK at 5/month cap
    check_and_increment(db, user_id)
    result = coordinator.run(audio.file.read())
    row = (
        db.table("debriefs")
        .insert(
            {
                "user_id": user_id,
                "observation": result["observation"],
                "pattern_to_reduce": result["pattern_to_reduce"],
                "thing_to_try_next": result["thing_to_try_next"],
                "stats": result["stats"],
                "transcript": result["transcript"],
            }
        )
        .execute()
    )
    usage = get_usage(db, user_id)
    return {"debrief": row.data[0], "used_this_month": usage["used_this_month"], "remaining": usage["remaining"]}


@app.get("/debriefs", response_model=list[Debrief])
def debriefs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(verify_token),
    db: Client = Depends(get_db),
):
    result = (
        db.table("debriefs")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data
