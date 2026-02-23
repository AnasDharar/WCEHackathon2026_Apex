from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field

from app.schemas.resources import ResourceItem


AssessmentId = Literal["gad7", "phq9"]


class AssessmentOption(BaseModel):
    value: int
    label: str


class AssessmentQuestion(BaseModel):
    id: str
    text: str


class AssessmentDefinition(BaseModel):
    id: AssessmentId
    title: str
    use: str
    duration: str
    options: List[AssessmentOption]
    questions: List[AssessmentQuestion]


class QuestionnaireSubmission(BaseModel):
    test_id: AssessmentId
    answers: List[int] = Field(..., min_length=1)


class SubmitAssessmentsRequest(BaseModel):
    submissions: List[QuestionnaireSubmission] = Field(..., min_length=1)
    max_recommendations: int = Field(default=5, ge=1, le=10)


class QuestionBreakdownItem(BaseModel):
    question_id: str
    question: str
    score: int
    label: str
    adjusted_score: int | None = None


class QuestionnaireResult(BaseModel):
    test_id: AssessmentId
    title: str
    total_score: int
    max_score: int
    severity: str
    interpretation: str
    breakdown: List[QuestionBreakdownItem]
    sensitive_alert: bool = False


class SafetyAlert(BaseModel):
    level: Literal["warning", "critical"]
    title: str
    message: str


class AssessmentStatus(BaseModel):
    needs_assessment: bool
    onboarding_complete: bool
    total_submissions: int
    last_submitted_at: str | None = None


class SubmitAssessmentsResponse(BaseModel):
    success: bool = True
    submitted_at: str
    summary: str
    requires_immediate_attention: bool
    alerts: List[SafetyAlert]
    questionnaire_results: List[QuestionnaireResult]
    recommended_resources: List[ResourceItem]
    reasoning: str | None = None
