from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AssessmentSubmission(BaseModel):
    """Single assessment submission payload."""

    test_id: str
    answers: list[int] = Field(default_factory=list)


class AssessmentSubmitRequest(BaseModel):
    """Batch assessment request."""

    submissions: list[AssessmentSubmission]


class AssessmentResultResponse(BaseModel):
    """Assessment result returned by APIs."""

    id: int
    user_id: int
    test_id: str
    score: int
    severity: str
    summary: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
