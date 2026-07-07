from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request


BASE_URL = os.environ.get("MIRRA_BACKEND_URL", "http://localhost:8000").rstrip("/")


def request(path: str, method: str = "GET", body: dict | None = None) -> tuple[int, dict]:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=data,
        method=method,
        headers={"Content-Type": "application/json"} if body is not None else {},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        payload = exc.read().decode("utf-8")
        return exc.code, json.loads(payload) if payload else {}


def main() -> int:
    health_status, health = request("/health")
    print("health", health_status, health)
    if health_status != 200:
        return 1

    status_code, status = request("/auth/status")
    print("auth_status", status_code, status)
    if status_code != 200:
        return 1

    if not status.get("username_password_ready"):
        print("username smoke skipped: configure SUPABASE_SERVICE_ROLE_KEY")
        return 2

    username = f"smoke_{int(time.time())}"
    password = "smoketest123"
    signup_code, signup = request(
        "/auth/username/sign-up",
        "POST",
        {"username": username, "password": password},
    )
    print("username_sign_up", signup_code, {"has_access_token": bool(signup.get("access_token"))})
    if signup_code != 200 or not signup.get("access_token"):
        return 1

    signin_code, signin = request(
        "/auth/username/sign-in",
        "POST",
        {"username": username, "password": password},
    )
    print("username_sign_in", signin_code, {"has_access_token": bool(signin.get("access_token"))})
    if signin_code != 200 or not signin.get("access_token"):
        return 1

    if not status.get("google_enabled"):
        print("google smoke skipped: enable Google provider in Supabase")
        return 2

    print("auth smoke passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
