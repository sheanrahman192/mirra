# Mirra — Design Document

## Problem

Most people who struggle socially aren't bad speakers — they're bad conversationalists. Existing tools like Orai and Speeko address public speaking mechanics (filler words, pacing, energy). No consumer app addresses the interpersonal signals that determine whether someone is engaging, likeable, and fun to talk to in everyday life.

The alternative — Toastmasters, coaching, deliberate practice — is a major time investment. Users have to consciously carve out time to rehearse and analyze. Mirra eliminates that friction entirely.

---

## Target User

Someone trying to make more friends. Not preparing for a pitch or a presentation — navigating daily casual interactions: lunch with coworkers, talking to someone new at a party, catching up with an acquaintance.

**Pain profile:**
- Inept at making conversations engaging or fun
- Poor tonality, flat energy, weak vocabulary
- Doesn't know what they're doing wrong because no one tells them
- Frequency: daily — every verbal interaction is an instance of this pain
- Willingness to pay: moderate, freemium model

---

## Differentiation from Orai

| | Orai | Mirra |
|---|---|---|
| Input | Rehearsed performance into mic | Real conversations with real people |
| Goal | Nail a presentation | Be more likeable in daily life |
| Signals | Filler words, pace, energy | Engagement, rapport, social dynamics |
| User | Professional preparing for high-stakes moment | Anyone wanting better relationships |
| Feedback loop | After practice session | After real conversation |

The moat is not the recording mechanism. It is the analysis layer — measuring whether you are a good **conversationalist**, not whether you are a good **speaker**.

---

## Core Social Signals (MVP)

These are measurable from audio + transcript and directly correlate with conversational quality:

1. **Talk/listen ratio** — are you dominating or creating space?
2. **Question frequency** — are you showing interest or monologuing?
3. **Interruption patterns** — are you cutting people off?
4. **Energy mirroring** — does your energy match or actively diverge from the other person?
5. **Vocabulary range** — are you engaging or repetitive?

Filler words are tracked but are not the headline metric. They are an Orai feature, not a Mirra feature.

---

## Recording Architecture

Two ingestion paths. Native recording is the primary experience. File import is the fallback for users who recorded elsewhere.

---

### Path 1 — Native In-App Recording (Primary)

`AVAudioSession` + `AVAudioEngine` with `audio` declared in `UIBackgroundModes`. Mirra holds the audio session alive when the screen locks or the user switches apps. iOS enforces the orange microphone indicator — non-suppressible, serves as the user-visible recording state. Sessions up to ~1 hour.

The recorder UI is a single large button. Start and stop. No other controls. Familiar enough that it requires no explanation.

#### Voice Activity Detection
Silero VAD runs continuously on the on-device Neural Engine in low-power monitoring state. Full recording activates only when speech is detected, dropping back to monitoring during silence.

**Battery impact with VAD: ~10-15% additional drain** (acceptable, comparable to GPS).

#### Speaker Separation
VAD separates user speech from other-party speech at the segment level. **Only the user's audio segments are transcribed, analyzed, and stored. The other party's audio is discarded immediately after VAD classification.** Raw audio is purged after processing — only derived insights are persisted.

#### Processing Pipeline
```
One tap start
    → AVAudioSession activates with Audio Background Mode
    → Silero VAD monitors continuously on Neural Engine
    → Speech detected → user segments captured, other party discarded
    → Silence → low-power monitoring state
One tap stop
    → User speech segments batched
    → Whisper API → transcript
    → Prosody model → pitch variance, energy, pace
    → Claude → social signal analysis
    → Debrief card generated and surfaced
```

---

### Path 2 — External File Import (Fallback)

Users who recorded a session elsewhere (Voice Memos, another recorder app) can import the file into Mirra via:

- **Share sheet** — from Voice Memos or Files, tap Share → Mirra. Mirra registers a share extension accepting `.m4a` and `.mp4` audio files.
- **In-app file picker** — a secondary "Import recording" option within Mirra opens the system document picker.

Once imported, the file enters the same processing pipeline as a native recording. From the user's perspective the debrief card looks identical regardless of ingestion path.

**What is not supported:** automatic or background ingestion from Voice Memos. iOS sandboxing prevents third-party apps from reading Voice Memos' file container without explicit user action. Import always requires one deliberate user step.

---

## Start/Stop Mechanism

All triggers call the same `ToggleRecordingIntent` with `openAppWhenRun = false`. Start if idle, stop if recording. The app never surfaces — the orange mic indicator is the only visible signal. Behavior is identical across all surfaces.

**Primary — Control Center widget (iOS 18+)**
A `ControlWidget` toggle in Control Center invoking `ToggleRecordingIntent`. User swipes down from the lock screen and taps the widget — no unlock required. The widget reflects live recording state (idle / recording).

**In-app record button**
Calls `ToggleRecordingIntent` directly. Same intent, same behavior.

**Progressive enhancements**
- **Action Button** — iPhone 15 Pro / 16+. Single press, one hardware button, no screen interaction.
- **Back Tap** — iPhone 8+ / iOS 14+. Double or triple tap the back of the phone, screen off, phone in pocket.
- **Lock screen buttons** — iOS 18+. Bottom-corner lock screen shortcuts mapped to `ToggleRecordingIntent`.

---

## Output: Debrief Card

Surfaced immediately after the user stops recording. One card per conversation.

**Structure:**
- One score (0–100 conversational engagement index)
- Three bullets: one observation, one specific pattern to reduce, one specific thing to try next time
- Key stats: talk/listen ratio, question count, interruption count

**Design principle:** A score, not a recording playback. Self-listening creates cringe paralysis. A number creates a feedback loop.

---

## Legal Strategy

### The Risk
13 US states (including California, Florida, Illinois) require all-party consent for recording. A Mirra user recording a casual conversation without informing the other party may violate state wiretapping law in these jurisdictions. GDPR requires explicit consent from all parties in the EU.

### Mitigation
1. **Onboarding disclaimer** — before first session, user acknowledges: *"Recording consent laws vary by location. In some states, all parties must be informed before a conversation is recorded. You are responsible for complying with the laws in your jurisdiction."*
2. **Terms of Service** — liability shift to user for consent compliance, consistent with Otter.ai, Rev, and Notta.

### Architecture Contribution
The speaker-separation architecture (user audio only, other party discarded) reduces the privacy exposure surface, but does not resolve the wiretapping question — the act of recording is the legal trigger, not the storage of the other party's voice.

This is a known, accepted risk in the audio recording app category and is not a reason to delay shipping.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Platform | iOS first | Native Audio Background Mode, Back Tap, Action Button |
| Audio capture | AVAudioEngine + AVAudioSession | Native, high-privilege, same stack as Voice Memos |
| VAD | Silero VAD (on-device) | Lightweight, Neural Engine acceleration, no API cost |
| Transcription | OpenAI Whisper API | Cheapest to start, swap for on-device Whisper later |
| Analysis | Claude API | Social signal extraction from transcript + prosody data |
| Storage | On-device (CoreData) + optional iCloud sync | Insights only, no raw audio persisted |

---

## Business Model

Freemium.

- **Free tier:** 5 conversation debriefs per month
- **Paid tier:** Unlimited debriefs, historical trends, weekly pattern summary

Conversion trigger: user hits the free cap after a week of active use.

---

## What This Is Not (v1)

- Not an always-on ambient recorder
- Not a public speaking coach
- Not a real-time in-ear coach (future)
- Not a team or B2B product (future)
- No weekly/monthly aggregate dashboard (v2)
- No on-device ML for transcription (v2)

---

## Future Architecture Fit

The per-conversation data layer sets up:
- **v2:** Cross-conversation pattern detection — "you interrupt more when talking to new people than close friends"
- **v3:** Real-time nudges via AirPods (low-latency on-device inference)
- **B2B:** Team-level communication analytics for managers, sales orgs, customer support


