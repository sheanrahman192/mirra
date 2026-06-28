from fastapi import Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client

from app.auth import verify_token
from app.config import settings
from app.db import get_db
from app.models.debrief import Debrief
from app.usage import get_usage

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
