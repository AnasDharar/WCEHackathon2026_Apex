import json

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database.db import get_session
from app.repositories.assessment_repository import AssessmentRepository
from app.repositories.mood_repository import MoodRepository
from app.repositories.user_profile_repository import UserProfileRepository
from app.services.auth_service import get_current_user
from app.services.habit_service import HabitService
from app.services.resource_service import ResourceService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
@router.get("/")
async def get_dashboard(
    user=Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Return dashboard payload expected by frontend."""
    habit_service = HabitService(session)
    resource_service = ResourceService(session)
    assessment_repository = AssessmentRepository(session)
    profile_repository = UserProfileRepository(session)
    mood_repository = MoodRepository(session)

    habits = habit_service.list_habits(user.id)
    assessments = assessment_repository.list_by_user(user.id)
    profile = profile_repository.get_by_user_id(user.id)
    recommendations = await resource_service.get_recommendations(user.id)
    moods = mood_repository.list_by_user(user.id, limit=7)

    risk_level = profile.risk_level if profile else "low"
    mood_trend = profile.mood_trend if profile else "unknown"
    mood_scores = [m.mood_score for m in moods]
    mood_avg_7d = round(sum(mood_scores) / len(mood_scores), 2) if mood_scores else None
    user_problems: list[dict[str, str]] = []
    if profile and profile.current_problems_json:
        try:
            parsed = json.loads(profile.current_problems_json)
            if isinstance(parsed, list):
                user_problems = [item for item in parsed if isinstance(item, dict)]
        except Exception:
            user_problems = []

    if not user_problems:
        user_problems = [
            {"name": item.test_id.upper(), "severity": item.severity}
            for item in assessments[:5]
        ]

    explanations: list[str] = []
    if mood_avg_7d is not None:
        explanations.append(f"Your 7-check-in mood average is {mood_avg_7d}/10.")
    explanations.append(f"Mood trend is '{mood_trend}'.")
    explanations.append(f"Risk level is '{risk_level}'.")
    explanations.append(f"Recommendations use: mood, assessments, and habit completion.")

    next_actions: list[dict[str, str]] = [
        {"title": "Log today’s mood (if you haven’t)", "because": "Better data means better personalization."},
        {"title": "Complete 1 interactive exercise", "because": "Active interventions reduce stress quicker."},
        {"title": "Open 1 recommended resource", "because": "Resources are selected from your recent signals."},
    ]

    interactive_exercises = [
        {
            "id": "breathing-478",
            "title": "4-7-8 Breathing",
            "type": "breathing",
            "duration": "1 min",
            "description": "Quickly lower anxiety with this guided rhythmic breathing exercise.",
            "color": "bg-emerald-50 text-emerald-700 border-emerald-200"
        },
        {
            "id": "grounding-54321",
            "title": "5-4-3-2-1 Grounding",
            "type": "grounding",
            "duration": "2 mins",
            "description": "Reconnect with your surroundings to break panic loops.",
            "color": "bg-blue-50 text-blue-700 border-blue-200"
        },
        {
            "id": "mood-checkin",
            "title": "Daily Reflection",
            "type": "reflection",
            "duration": "1 min",
            "description": "Log how you are feeling to improve Zenith's insights.",
            "color": "bg-purple-50 text-purple-700 border-purple-200"
        }
    ]

    return {
        "data": {
            "user_state": {
                "risk_level": risk_level,
                "mood_trend": mood_trend,
                "mood_avg_7d": mood_avg_7d,
            },
            "user_problems": user_problems,
            "interactive_exercises": interactive_exercises,
            "recommended_habits": habits[:5],
            "recommended_resources": recommendations.get("resources", []),
            "explanations": explanations,
            "next_actions": next_actions,
        }
    }
