# ManahAarogya Backend (AI Personalized)

This backend is fully centered on **AI-detected user problems**.

Main personalization sources:
- `user_state`
- `user_problems`

When user submits chat/assessment/mood, backend:
1. detects problems,
2. updates user state,
3. serves personalized recommendations.

## Stack

- FastAPI
- SQLAlchemy Async
- Supabase PostgreSQL
- Firebase Admin SDK
- LangChain + LangGraph

## Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

## Environment

```env
DATABASE_URL=postgresql+psycopg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
CEREBRAS_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=
```

## Key APIs

- `POST /api/v1/auth/login`
- `GET /api/v1/user/me`
- `PUT /api/v1/user/profile`
- `POST /api/v1/assessment/submit`
- `POST /api/v1/chat/message`
- `GET /api/v1/chat/history`
- `POST /api/v1/mood/log`
- `GET /api/v1/dashboard`
- `GET /api/v1/habits`
- `POST /api/v1/habits/add`
- `POST /api/v1/habits/complete`
- `GET /api/v1/resources`
- `POST /api/v1/forum/post`
- `GET /api/v1/forum/posts`
- `POST /api/v1/forum/comment`
- `GET /api/v1/counsellors`
- `GET /api/v1/counsellor/slots`
- `POST /api/v1/appointments/book`
- `GET /api/v1/events`
- `POST /api/v1/events/register`

## Frontend integration note

Frontend should call:
- `GET /dashboard`
- `POST /chat/message`
- `POST /assessment/submit`
- `POST /mood/log`

with base URL `http://127.0.0.1:8000/api/v1`.
