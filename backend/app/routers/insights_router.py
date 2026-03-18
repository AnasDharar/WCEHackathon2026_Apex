import json

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database.db import get_session
from app.repositories.assessment_repository import AssessmentRepository
from app.repositories.habit_repository import HabitRepository
from app.repositories.mood_repository import MoodRepository
from app.repositories.user_profile_repository import UserProfileRepository
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/daily")
def daily_insights(user=Depends(get_current_user), session: Session = Depends(get_session)):
    """Return a simple daily insight payload with explanations and next actions."""
    mood_repo = MoodRepository(session)
    habit_repo = HabitRepository(session)
    assessment_repo = AssessmentRepository(session)
    profile_repo = UserProfileRepository(session)

    profile = profile_repo.get_by_user_id(user.id)
    moods = mood_repo.list_by_user(user.id, limit=7)
    habits = habit_repo.list_by_user(user.id)
    assessments = assessment_repo.list_by_user(user.id)[:3]

    mood_scores = [m.mood_score for m in moods]
    mood_avg = round(sum(mood_scores) / len(mood_scores), 2) if mood_scores else None
    completed = sum(1 for h in habits if h.done)
    total = len(habits)

    risk_level = profile.risk_level if profile else "low"
    mood_trend = profile.mood_trend if profile else "unknown"

    problems = []
    if profile and profile.current_problems_json:
        try:
            parsed = json.loads(profile.current_problems_json)
            if isinstance(parsed, list):
                problems = parsed[:5]
        except Exception:
            problems = []
    if not problems:
        problems = [{"name": a.test_id.upper(), "severity": a.severity} for a in assessments]

    explanations: list[str] = []
    if mood_avg is not None:
        explanations.append(f"Your 7-check-in mood average is {mood_avg}/10.")
    explanations.append(f"Mood trend is marked as '{mood_trend}'.")
    explanations.append(f"Risk level is currently '{risk_level}'.")
    if total:
        explanations.append(f"You completed {completed}/{total} habits recently.")
    if problems:
        top = problems[0]
        if isinstance(top, dict) and top.get("name") and top.get("severity"):
            explanations.append(f"Most recent focus area: {top['name']} ({top['severity']}).")

    next_actions: list[dict[str, str]] = []
    if mood_avg is not None and mood_avg <= 4:
        next_actions.append(
            {
                "title": "Do a 60-second grounding reset",
                "because": "Lower mood averages respond well to very small, immediate regulation steps.",
            }
        )
    next_actions.append(
        {
            "title": "Pick one tiny habit for today",
            "because": "Consistency builds momentum and improves mood stability over time.",
        }
    )
    next_actions.append(
        {
            "title": "Check the recommended resources",
            "because": "They’re selected based on your recent signals (mood trend + assessments).",
        }
    )

    summary = "We’re tracking your mood + habits to personalize support."
    if mood_avg is not None:
        summary = f"Today’s snapshot: mood_avg_7d={mood_avg}/10, trend={mood_trend}, risk={risk_level}."

    return {
        "data": {
            "summary": summary,
            "signals": {
                "mood_avg_7d": mood_avg,
                "mood_trend": mood_trend,
                "risk_level": risk_level,
                "habit_completion": {"total": total, "completed": completed},
                "problems": problems,
            },
            "explanations": explanations,
            "next_actions": next_actions,
        }
    }

