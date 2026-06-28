from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client

from app.auth import verify_token
from app.config import settings
from app.db import get_db
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
