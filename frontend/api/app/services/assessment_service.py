import json

from fastapi import Depends
from sqlmodel import Session

from app.agents.resource_agent import resource_agent
from app.database.db import get_session
from app.database.models import AssessmentAnswer
from app.database.models import AssessmentResult
from app.repositories.assessment_answer_repository import AssessmentAnswerRepository
from app.repositories.assessment_repository import AssessmentRepository
from app.repositories.user_profile_repository import UserProfileRepository


class AssessmentService:
    """Business logic for assessments and scoring."""

    def __init__(self, session: Session) -> None:
        """Create service with repository dependencies."""
        self.assessment_repository = AssessmentRepository(session)
        self.assessment_answer_repository = AssessmentAnswerRepository(session)
        self.user_profile_repository = UserProfileRepository(session)

    def get_catalog(self) -> list[dict[str, str]]:
        """Return static assessment catalog."""
        return [
            {"test_id": "phq9", "name": "PHQ-9", "description": "Depression symptom screening"},
            {"test_id": "gad7", "name": "GAD-7", "description": "Anxiety symptom screening"},
            {"test_id": "stress10", "name": "Stress-10", "description": "Perceived stress check"},
        ]

    def list_assessments(self, user_id: int) -> list[AssessmentResult]:
        """Return saved assessments for a user."""
        return self.assessment_repository.list_by_user(user_id)

    def submit_batch(self, user_id: int, submissions: list[dict]) -> dict[str, object]:
        """Score and store multiple assessment submissions."""
        saved_results: list[AssessmentResult] = []
        answer_rows: list[AssessmentAnswer] = []
        severity_labels: list[str] = []
        user_problems: list[dict[str, str]] = []
        for submission in submissions:
            score_value = sum(submission.get("answers", []))
            severity = self._severity_from_score(score_value)
            summary = f"{submission.get('test_id', 'assessment').upper()} indicates {severity} symptoms."
            result = AssessmentResult(
                user_id=user_id,
                test_id=submission.get("test_id", "unknown"),
                score=score_value,
                severity=severity,
                summary=summary,
            )
            saved_results.append(self.assessment_repository.create(result))
            severity_labels.append(severity)
            user_problems.append({"name": submission.get("test_id", "unknown").upper(), "severity": severity})

            answers = submission.get("answers", [])
            for idx, answer_value in enumerate(answers):
                answer_rows.append(
                    AssessmentAnswer(
                        user_id=user_id,
                        test_id=submission.get("test_id", "unknown"),
                        question_index=idx,
                        answer_value=int(answer_value),
                    )
                )

        self.assessment_answer_repository.create_many(answer_rows)

        risk_level = "low"
        if any(label in {"severe", "moderate"} for label in severity_labels):
            risk_level = "high"
        elif any(label == "mild" for label in severity_labels):
            risk_level = "medium"

        self.user_profile_repository.upsert(
            user_id=user_id,
            has_completed_assessment=True,
            risk_level=risk_level,
            current_problems_json=json.dumps(user_problems),
        )

        categories = resource_agent.recommend_categories(severity_labels)
        return {
            "results": saved_results,
            "recommended_categories": categories,
            "user_problems": user_problems,
            "risk_level": risk_level,
        }

    def _severity_from_score(self, score_value: int) -> str:
        """Translate score into severity label."""
        if score_value >= 20:
            return "severe"
        if score_value >= 14:
            return "moderate"
        if score_value >= 8:
            return "mild"
        return "minimal"


def get_assessment_service(session: Session = Depends(get_session)) -> AssessmentService:
    """FastAPI dependency for AssessmentService."""
    return AssessmentService(session)
