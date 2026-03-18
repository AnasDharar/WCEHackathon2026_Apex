import json

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database.db import get_session
from app.repositories.assessment_answer_repository import AssessmentAnswerRepository
from app.repositories.assessment_repository import AssessmentRepository
from app.repositories.mood_repository import MoodRepository
from app.repositories.user_profile_repository import UserProfileRepository
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me")
def my_profile(user=Depends(get_current_user), session: Session = Depends(get_session)):
    """Return full user profile for personalization and audit surfaces."""
    profile_repository = UserProfileRepository(session)
    assessment_repository = AssessmentRepository(session)
    answer_repository = AssessmentAnswerRepository(session)
    mood_repository = MoodRepository(session)

    profile = profile_repository.get_by_user_id(user.id)
    assessments = assessment_repository.list_by_user(user.id)
    answers = answer_repository.list_by_user(user.id, limit=120)
    moods = mood_repository.list_by_user(user.id, limit=14)

    current_problems = []
    if profile and profile.current_problems_json:
        try:
            parsed = json.loads(profile.current_problems_json)
            if isinstance(parsed, list):
                current_problems = parsed
        except Exception:
            current_problems = []

    return {
        "data": {
            "user": user,
            "profile": {
                "has_completed_assessment": profile.has_completed_assessment if profile else False,
                "risk_level": profile.risk_level if profile else "low",
                "mood_trend": profile.mood_trend if profile else "unknown",
                "current_problems": current_problems,
                "updated_at": profile.updated_at.isoformat() if profile else None,
            },
            "latest_assessments": [
                {
                    "test_id": item.test_id,
                    "score": item.score,
                    "severity": item.severity,
                    "created_at": item.created_at.isoformat(),
                }
                for item in assessments[:5]
            ],
            "recent_answers": [
                {
                    "test_id": item.test_id,
                    "question_index": item.question_index,
                    "answer_value": item.answer_value,
                    "created_at": item.created_at.isoformat(),
                }
                for item in answers[:30]
            ],
            "recent_moods": [
                {
                    "score": item.mood_score,
                    "notes": item.notes,
                    "created_at": item.created_at.isoformat(),
                }
                for item in moods
            ],
        }
    }
