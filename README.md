# Manah Arogya (acm2k26)

Full-stack mental wellness platform with:
- Next.js frontend (`frontend/`)
- FastAPI backend API (`frontend/api/`)
- Real-time voice assistant + guided exercises (LiveKit worker: `frontend/api/app/workers/agent.py`)
- AI flows (LangGraph + Cerebras) with safety-focused fallbacks

## Features

- Google sign-in flow and user session handling
- Assessment flow (PHQ-9 + GAD-7), scoring, summary, alerts
- Dashboard overview
- Habit tracker + AI habit coach
- AI assistant chat with conversation history
- Resource library + AI recommendations
- Appointments booking and rescheduling
- Events discovery and registration
- Community posts, likes, replies, groups, mentors
- Voice assistant "Therapy Room" with selectable doctor persona + language, live transcript (LiveKit)
- Guided breathing exercise coach with UI-synced stages (LiveKit data channel)

## Tech Stack

- Frontend: Next.js 16, React 19
- Backend: FastAPI, Pydantic, LangGraph
- AI: langchain-cerebras (with fallback behavior if key/model is unavailable)
- Realtime voice: LiveKit (token minting via backend) + LiveKit Agents worker (Sarvam STT/TTS + Sarvam-hosted LLM)
- Auth/UI session: Firebase (frontend side)

## Project Structure

```text
acm2k26/
  frontend/
    api/
      requirements.txt
      app/
        main.py
        workers/
          agent.py
    package.json
    src/
  backend/           # legacy folder (not used by the current FastAPI app)
  requirements.txt   # root entrypoint -> frontend/api/requirements.txt
```

## Prerequisites

- Python 3.10+
- Node.js 18+ (recommended 20 LTS)
- npm
- A LiveKit server (Cloud or self-hosted) for voice sessions
- A Sarvam API key (for STT/TTS + LLM via Sarvam)

## Setup (Run from Root)

### 1. Backend API (FastAPI)

```bash
cd frontend/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create `frontend/api/.env`:

```env
APP_NAME=Manah Arogya Backend API
APP_VERSION=2.0.0
APP_ENV=development
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Optional but recommended for live LLM calls
CEREBRAS_API_KEY=your_key_here
CEREBRAS_MODEL=gpt-oss-120b
CEREBRAS_TEMPERATURE=0.2

# LiveKit (required for voice features)
LIVEKIT_URL=your_livekit_wss_or_https_url
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
LIVEKIT_TOKEN_TTL_MINUTES=60

# Sarvam (required for the LiveKit Agents worker)
SARVAM_API_KEY=your_sarvam_key
```

Run backend:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Voice Worker (LiveKit Agents)

The frontend joins a LiveKit room; the worker joins the same room and runs the doctor/exercise agent based on the room name.

```bash
cd frontend/api
python app/workers/agent.py --help
```

Then run it using the LiveKit Agents CLI command that fits your environment (commonly `dev` for local development), for example:

```bash
cd frontend/api
python app/workers/agent.py dev
```

Room naming conventions used by the UI (important for correct agent selection):
- Doctor rooms: `mental-health-{doctorId}__{languageCode}__{suffix}`
- Exercise rooms: `mental-health-exercise-{exerciseId}__{languageCode}__{suffix}`

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Run frontend:

```bash
npm run dev
```

Open: `http://localhost:3000`

Voice pages:
- `http://localhost:3000/home/voice-assistant`
- `http://localhost:3000/home/exercises`

## Build / Verification

### Frontend checks

```bash
cd frontend
npm run lint
npm run build
```

### Backend quick check

Backend docs:
- `http://127.0.0.1:8000/docs`

Health endpoints:
- `GET /`
- `GET /health`

Voice token endpoint (backend mints a LiveKit access token):
- `POST /api/v1/voice/token` with JSON `{ "room_name": "...", "participant_name": "..." }`
- `GET /api/v1/voice/token?room_name=...&participant_name=...` (compat)

## GitHub Push Checklist (Before Push)

1. Ensure secrets are not staged (`frontend/api/.env`, any local keys, tokens).
2. Run frontend checks (`npm run lint` and `npm run build`).
3. Run backend and verify `/docs` + health endpoints.
4. Check changes:
   - `git status`
   - `git diff --stat`
5. Stage and commit:
   - `git add .`
   - `git commit -m "your message"`
6. Push:
   - `git push origin main`

## Notes

- Root repo contains `backend/.git` as nested metadata in your local workspace. This is ignored by root `.gitignore` to avoid accidental nested-repo commits.
- Root `requirements.txt` is intentionally mapped to `frontend/api/requirements.txt` for simple backend setup from the repo root.
