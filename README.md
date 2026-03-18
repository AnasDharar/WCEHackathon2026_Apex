# Manah Arogya (acm2k26)

Full-stack mental wellness platform:
- Next.js frontend (`frontend/`)
- FastAPI backend API (`frontend/api/`)
- Real-time voice assistant + guided exercises (LiveKit worker: `frontend/api/app/workers/agent.py`)
- AI flows (LangGraph + Cerebras) with safety-focused fallbacks

## Features

- Google sign-in flow and user session handling (Firebase)
- Personalized dashboard and profile
- Assessment flow (PHQ-9 + GAD-7), scoring, summaries, alerts
- Habit tracker + AI habit coach
- AI assistant chat with conversation history
- Resource library + AI recommendations
- Appointments booking and rescheduling
- Events discovery and registration
- Community posts, likes, replies, groups, mentors
- Voice assistant "Therapy Room" with selectable doctor persona + language, live transcript (LiveKit)
- Guided breathing exercise coach with UI-synced stages (LiveKit data channel)

## Tech Stack

- Frontend: Next.js 16.1.6, React 19.2.3, Tailwind CSS 4
- Backend: FastAPI, Pydantic
- AI: LangGraph + `langchain-cerebras` (fallback models supported)
- Realtime voice: LiveKit (token minting via backend) + LiveKit Agents worker
- Auth/UI session: Firebase (frontend side)

## Repository Layout

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

## Code Map (Key Files)

- Frontend app entry: `frontend/src/app/layout.js` and `frontend/src/app/page.js`
- Main app pages: `frontend/src/app/home/*`
- Voice assistant UI: `frontend/src/app/home/voice-assistant/page.jsx`
- Breathing exercises UI: `frontend/src/app/home/exercises/page.jsx`
- AI chatbot UI: `frontend/src/app/home/ai-chatbot/page.jsx`
- FastAPI app entry: `frontend/api/app/main.py`
- LiveKit worker: `frontend/api/app/workers/agent.py`
- AI graph + services: `frontend/api/app/ai/graph.py`, `frontend/api/app/services/*`
- API routers: `frontend/api/app/routers/*`

## Frontend Routes

- `/` Landing page
- `/signin` Auth entry
- `/home` Main app shell
- `/home/ai-chatbot` AI chat
- `/home/appointments` Appointments
- `/home/community` Community
- `/home/events` Events
- `/home/exercises` Guided breathing exercises
- `/home/habit-tracker` Habit tracking
- `/home/resources` Resources
- `/home/voice-assistant` Voice assistant

## Backend API Modules

The FastAPI app mounts routers for:
- `auth`, `profile`, `dashboard`
- `habits`, `assessments`, `chatbot`
- `resources`, `appointments`, `events`, `community`
- `voice` (LiveKit token minting + compat routes)
- `health`

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
CORS_ALLOW_ORIGIN_REGEX=https?://(localhost|127\.0\.0\.1)(:\\d+)?$

# Optional but recommended for live LLM calls
CEREBRAS_API_KEY=your_key_here
CEREBRAS_MODEL=gpt-oss-120b
CEREBRAS_TEMPERATURE=0.2
CEREBRAS_FALLBACK_MODELS=llama3.1-8b

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

## Frontend Scripts

From `frontend/`:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## AI + Voice Data Flow (High-Level)

1. User opens voice page in the frontend.
2. Frontend requests a LiveKit token from the backend (`/api/v1/voice/token`).
3. Frontend joins the LiveKit room with that token.
4. The LiveKit Agents worker joins the same room and provides:
   - Doctor persona conversation
   - Guided breathing coach
5. STT/TTS and LLM calls are handled via Sarvam plugins; text fallback uses Cerebras where configured.

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
