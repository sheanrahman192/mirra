from uuid import uuid4

from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import httpx
from jose import JWTError, jwt
from supabase import Client

from app.auth import verify_token
from app.config import settings
from app.db import get_db
from app.models.auth import UsernameAuthRequest, UsernameAuthResponse
from app.models.debrief import Debrief, SessionResponse
from app.pipeline import coordinator
from app.usage import check_and_increment, get_usage

app = FastAPI(title="Mirra Backend")

MAX_AUDIO_BYTES = 25 * 1024 * 1024
SUPPORTED_AUDIO_TYPES = {
    "audio/aac",
    "audio/mp4",
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/x-m4a",
    "audio/x-wav",
    "audio/webm",
}

USERNAME_CHARS = set("abcdefghijklmnopqrstuvwxyz0123456789_")

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


def _service_role_key_configured() -> bool:
    if settings.supabase_service_role_key.startswith("sb_secret_"):
        return True
    try:
        claims = jwt.get_unverified_claims(settings.supabase_service_role_key)
    except JWTError:
        return False
    return claims.get("role") == "service_role"


def _auth_provider_settings() -> dict:
    try:
        response = httpx.get(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/settings",
            headers={"apikey": settings.supabase_service_role_key},
            timeout=10,
        )
    except httpx.HTTPError:
        return {}
    if response.status_code >= 400:
        return {}
    return response.json()


@app.get("/auth/status")
def auth_status():
    provider_settings = _auth_provider_settings()
    external = provider_settings.get("external", {})
    return {
        "username_password_ready": _service_role_key_configured(),
        "google_enabled": bool(external.get("google")),
        "email_enabled": bool(external.get("email")),
        "signup_disabled": bool(provider_settings.get("disable_signup", False)),
    }


def _normalize_username(username: str) -> str:
    value = username.strip().lower()
    if len(value) < 3 or len(value) > 24 or any(ch not in USERNAME_CHARS for ch in value):
        raise HTTPException(
            status_code=422,
            detail="Username must be 3-24 characters and use only letters, numbers, or underscores",
        )
    return value


def _username_email(username: str) -> str:
    return f"{username}@users.mirra.local"


async def _password_token(email: str, password: str) -> dict:
    response = httpx.post(
        f"{settings.supabase_url.rstrip('/')}/auth/v1/token?grant_type=password",
        headers={
            "apikey": settings.supabase_service_role_key,
            "Content-Type": "application/json",
        },
        json={"email": email, "password": password},
        timeout=15,
    )
    if response.status_code >= 400:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return response.json()


@app.post("/auth/username/sign-up", response_model=UsernameAuthResponse)
async def username_sign_up(payload: UsernameAuthRequest):
    username = _normalize_username(payload.username)
    email = _username_email(username)
    response = httpx.post(
        f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users",
        headers={
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        },
        json={
            "email": email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {"username": username},
        },
        timeout=15,
    )
    if response.status_code in {401, 403}:
        raise HTTPException(status_code=503, detail="Supabase service-role key is required for username sign-up")
    if response.status_code == 422:
        raise HTTPException(status_code=409, detail="Username is already taken")
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Could not create account")
    return await _password_token(email, payload.password)


@app.post("/auth/username/sign-in", response_model=UsernameAuthResponse)
async def username_sign_in(payload: UsernameAuthRequest):
    username = _normalize_username(payload.username)
    return await _password_token(_username_email(username), payload.password)


@app.get("/usage")
def usage(user_id: str = Depends(verify_token), db: Client = Depends(get_db)):
    return get_usage(db, user_id)


@app.post("/sessions", response_model=SessionResponse)
def create_session(
    audio: UploadFile = File(...),
    started_at: str | None = Form(None),
    client_duration_seconds: float | None = Form(None),
    title: str | None = Form(None),
    user_id: str = Depends(verify_token),
    db: Client = Depends(get_db),
):
    if audio.content_type and audio.content_type not in SUPPORTED_AUDIO_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported audio type")

    audio_bytes = audio.file.read()
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file is too large")

    # ponytail: charged on attempt not success; race window OK at 5/month cap
    check_and_increment(db, user_id)
    result = coordinator.run(audio_bytes)
    session_id = str(uuid4())
    metadata = {
        "started_at": started_at,
        "client_duration_seconds": client_duration_seconds,
        "title": title,
        "original_filename": audio.filename,
        "content_type": audio.content_type,
    }
    stats = {**result["stats"], "metadata": {k: v for k, v in metadata.items() if v is not None}}
    row = (
        db.table("debriefs")
        .insert(
            {
                "user_id": user_id,
                "session_id": session_id,
                "observation": result["observation"],
                "pattern_to_reduce": result["pattern_to_reduce"],
                "thing_to_try_next": result["thing_to_try_next"],
                "stats": stats,
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
