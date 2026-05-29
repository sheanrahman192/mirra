# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mirra is a conversational coaching iOS/Android app. It records real conversations, analyzes the user's speech for social signals (talk/listen ratio, question frequency, interruptions, energy, vocabulary), and surfaces a debrief card with coaching bullets and an AI-powered Reflect chat.

This is a monorepo with two top-level packages:
- `app/` — React Native (Expo bare workflow + TypeScript)
- `backend/` — FastAPI (Python 3.11+)

## Commands

### App (`app/`)
```bash
cd app
npm install
npx expo prebuild          # generate ios/ and android/ native code
npx expo run:ios           # run on iOS simulator
npx expo run:android       # run on Android emulator
```

### Backend (`backend/`)
```bash
cd backend
uv sync                    # or: pip install -e ".[dev]"
uvicorn app.main:app --reload
pytest                     # all tests
pytest tests/test_pipeline.py  # pipeline tests only
pytest tests/test_usage_gate.py
```

## Architecture

### Audio Pipeline (the core product)

All audio capture happens on-device as a plain WAV file; no streaming or on-device VAD. On stop, the app uploads the file to `POST /sessions`. The backend runs a synchronous pipeline in order:

1. `pipeline/vad.py` — Silero VAD extracts speech segments with timestamps and energy levels
2. `pipeline/speaker.py` — Energy-percentile heuristic: top-quartile energy = user, rest = other party. **User segments only** are passed forward; other-party audio is discarded.
3. `pipeline/whisper.py` — Concatenates user segments with 200ms silence pads → OpenAI Whisper API → transcript
4. `pipeline/prosody.py` — librosa: pitch (yin), RMS energy, WPM from transcript/duration
5. `pipeline/claude.py` — Anthropic `claude-sonnet-4-6` with `tool_use` for structured `DebriefCard` output. 2-retry on schema mismatch. System prompt + tool definition use `cache_control: ephemeral` (prompt caching).
6. `pipeline/coordinator.py` — orchestrates steps 1–5
7. Writes to Supabase `debriefs` table, increments `debrief_usage`

### Auth & JWT

The backend verifies Supabase JWTs on every request (`app/auth.py`). Uses `python-jose` against Supabase's JWKS endpoint — JWKS is cached (do not fetch per-request). `user_id` is extracted from the token and threaded through all DB operations.

### Data Models

The canonical types live in two places — keep them in sync:

**TypeScript** (`app/src/models/`):
```ts
interface DebriefCard {
  id: string; sessionId: string; createdAt: string;
  observation: string; patternToReduce: string; thingToTryNext: string;
  stats: ConversationStats;
}
interface ConversationStats {
  talkListenRatio: number; questionCount: number; interruptionCount: number;
  sessionDurationMinutes: number; userSpeechDurationMinutes: number; estimatedWPM: number;
}
```

**Python** (`backend/app/models/debrief.py`): same fields in `snake_case`. The API returns `snake_case`; `api/client.ts` converts to `camelCase` at the boundary.

### IPC for iOS-only triggers (Phase 5)

Control Center widget, Back Tap, and Lock Screen Shortcut all fire `ToggleRecordingIntent` (Swift AppIntents extension). The intent writes a command to a shared `UserDefaults` App Group container and posts a Darwin notification. A native `RCTEventEmitter` module in the main app listens for that Darwin notification and emits an event into RN, where `useRecorder.toggle()` is called. All four targets share App Group `group.com.<yourname>.mirra`.

### Android file import (Phase 4)

`react-native-receive-sharing-intent` handles `ACTION_SEND` intents with `audio/*` MIME type. `useSharedFile.ts` reads on mount and app foreground; shows a confirmation card instead of the record button. Always call `ReceiveSharingIntent.clearReceivedFiles()` after consuming the intent.

## Critical Gotchas

- **Expo prebuild + iOS extensions** — Phase 5 extension targets (`MirraIntents`, `MirraWidgets`, `MirraShare`) are not managed by Expo. After generating `ios/` with `expo prebuild`, either commit `ios/` and stop re-running prebuild, or write `withMod` config plugins. Re-running prebuild will clobber manual target additions.

- **Background recording** — iOS requires `UIBackgroundModes: ["audio"]` in `app.config.ts` and an active `AVAudioSession`. Android requires a foreground service with a persistent notification. Validate on real devices, not simulators, with screen locked for 5+ minutes.

- **Claude structured output** — always use `tool_use`, never free-text JSON parsing. The 2-retry loop in `claude.py` is mandatory before surfacing an error to the user.

- **Speaker classification accuracy** — the energy heuristic requires the user to be consistently closer to the mic. Document this constraint in onboarding. A dedicated speaker diarization model is planned for v2.

- **Whisper 25MB limit** — a 2-minute WAV at 16kHz mono is ~3.8MB (safe for MVP). Chunk at 20-minute boundaries if allowing longer sessions.

- **Supabase JWKS caching** — cache the JWKS response; do not fetch on every request.

- **Prompt caching** — mark the Claude system prompt and tool definition as `cache_control: ephemeral`. Track hit rate via `usage.cache_read_input_tokens` in SDK responses.

## Supabase Schema

- `users` — managed by Supabase Auth
- `debrief_usage(user_id, month_key UNIQUE WITH user_id, count int)` — monthly usage counter
- `debriefs(id uuid, user_id, created_at, observation, pattern_to_reduce, thing_to_try_next, stats jsonb, transcript text)`

Free tier cap: 5 debriefs/month. Enforced server-side — `POST /sessions` returns 402 when at cap.

## Backend API

| Endpoint | Description |
|---|---|
| `POST /sessions` | multipart `audio` (WAV/M4A ≤25MB) + JSON metadata → runs pipeline → returns `{ debrief, usedThisMonth, remaining }` |
| `GET /debriefs` | paginated debrief history for the authenticated user |
| `GET /usage` | `{ usedThisMonth, remaining, resetsAt }` |
