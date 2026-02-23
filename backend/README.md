# Manah Arogya Backend

FastAPI backend for the Manah Arogya platform with modular APIs for:

- Dashboard
- Habit Tracker
- AI Chatbot
- Resources + AI recommendations (LangGraph + ChatCerebras)
- Appointments
- Events
- Community

## 1. Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Environment Variables

Create `.env` in project root:

```env
APP_NAME=Manah Arogya Backend API
APP_VERSION=2.0.0
APP_ENV=development

# Frontend URLs (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Optional AI (ChatCerebras)
CEREBRAS_API_KEY=your_cerebras_api_key
CEREBRAS_MODEL=gpt-oss-120b
CEREBRAS_TEMPERATURE=0.2
```

If `CEREBRAS_API_KEY` is not set, AI endpoints still work with safe fallback logic.

## 3. Run Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open:

- API root: `http://127.0.0.1:8000/`
- Swagger docs: `http://127.0.0.1:8000/docs`

## 4. Frontend Integration (Next.js)

For your frontend, point API base URL to:

```txt
http://127.0.0.1:8000/api/v1
```

Example frontend env:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## 5. Main API Routes

### Health
- `GET /`
- `GET /health`

### User / Dashboard
- `GET /api/v1/users/me`
- `GET /api/v1/dashboard/overview`

### Habits
- `GET /api/v1/habits/stats`
- `GET /api/v1/habits/today`
- `PATCH /api/v1/habits/{habit_id}`
- `GET /api/v1/habits/weekly-progress`
- `GET /api/v1/habits/category-progress`
- `GET /api/v1/habits/calendar?year=2026&month=2`

### Chatbot
- `GET /api/v1/chatbot/conversations`
- `POST /api/v1/chatbot/conversations`
- `GET /api/v1/chatbot/conversations/{conversation_id}/messages`
- `POST /api/v1/chatbot/conversations/{conversation_id}/messages`
- `GET /api/v1/chatbot/quick-prompts`
- `GET /api/v1/chatbot/insights`
- `POST /api/v1/chatbot/insights/refresh`

### Resources
- `GET /api/v1/resources/categories`
- `GET /api/v1/resources/library`
- `GET /api/v1/resources/collections`
- `POST /api/v1/resources/recommendations`
- `POST /api/v1/resources/recommend-from-profile`
- `POST /api/v1/recommend-resources` (legacy-compatible alias)

### Appointments
- `GET /api/v1/appointments/stats`
- `GET /api/v1/appointments/upcoming`
- `GET /api/v1/appointments/open-slots`
- `GET /api/v1/appointments/prep-checklist`
- `POST /api/v1/appointments/book`
- `POST /api/v1/appointments/{appointment_id}/reschedule`

### Events
- `GET /api/v1/events/featured`
- `GET /api/v1/events/upcoming`
- `GET /api/v1/events/weekly-lineup`
- `POST /api/v1/events/{event_id}/reserve`
- `POST /api/v1/events/{event_id}/waitlist`

### Community
- `GET /api/v1/community/stats`
- `GET /api/v1/community/posts`
- `POST /api/v1/community/posts`
- `POST /api/v1/community/posts/{post_id}/like`
- `POST /api/v1/community/posts/{post_id}/reply`

## 6. Example: Resource Recommendation

Endpoint:

```http
POST /api/v1/recommend-resources
```

Request:

```json
{
  "responses": [
    {
      "question": "How often do you feel anxious?",
      "answer": "Mostly before exams and when deadlines are close."
    },
    {
      "question": "How is your sleep quality?",
      "answer": "I wake up at night and feel tired in the morning."
    }
  ],
  "resources": [
    {
      "id": 1,
      "title": "Guided Breathing for Exam Stress",
      "type": "Audio",
      "description": "Breathing practice to calm pre-exam anxiety and racing thoughts.",
      "tags": ["anxiety", "exam", "calm"]
    },
    {
      "id": 2,
      "title": "Resetting Your Sleep Clock",
      "type": "Article",
      "description": "Practical sleep hygiene steps for irregular sleep schedules.",
      "tags": ["sleep", "routine", "recovery"]
    }
  ],
  "max_recommendations": 2
}
```
