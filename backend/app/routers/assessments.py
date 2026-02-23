from __future__ import annotations

from fastapi import APIRouter, Depends

from app.routers.deps import get_optional_current_user
from app.schemas.assessments import (
    AssessmentDefinition,
    AssessmentStatus,
    SubmitAssessmentsRequest,
    SubmitAssessmentsResponse,
)
from app.schemas.resources import ResourceItem
from app.services.assessments import get_assessment_catalog, score_assessment_submissions
from app.services.langgraph_recommender import recommend_resources_with_langgraph
from app.services.runtime import store

router = APIRouter(prefix="/api/v1/assessments", tags=["assessments"])


@router.get("/catalog")
async def get_catalog(_: dict[str, object] | None = Depends(get_optional_current_user)) -> dict[str, object]:
    catalog = [AssessmentDefinition.model_validate(item) for item in get_assessment_catalog()]
    return {"success": True, "data": [item.model_dump() for item in catalog]}


def _resolve_user_id(current_user: dict[str, object] | None) -> str:
    profile = current_user or store.get_profile()
    return str(profile.get("id", "user-1"))


@router.get("/status")
async def get_assessment_status(
    current_user: dict[str, object] | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    status = AssessmentStatus.model_validate(store.get_assessment_status(_resolve_user_id(current_user)))
    return {"success": True, "data": status.model_dump()}


@router.get("/history")
async def get_assessment_history(
    current_user: dict[str, object] | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    history = store.get_assessment_history(_resolve_user_id(current_user))
    return {"success": True, "data": history}


@router.post("/submit")
async def submit_assessments(
    payload: SubmitAssessmentsRequest,
    current_user: dict[str, object] | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    scored = score_assessment_submissions(payload.submissions)
    resource_pool = store.list_ai_resource_pool()
    recommended, reasoning = await recommend_resources_with_langgraph(
        responses=scored["recommendation_context"],
        resources=resource_pool,
        max_recommendations=payload.max_recommendations,
    )
    recommended_items = [ResourceItem.model_validate(item) for item in recommended]

    submission_record = {
        "submitted_at": scored["submitted_at"],
        "submitted_at_display": scored["submitted_at_display"],
        "summary": scored["summary"],
        "requires_immediate_attention": scored["requires_immediate_attention"],
        "alerts": scored["alerts"],
        "questionnaire_results": scored["questionnaire_results"],
        "recommended_resources": [item.model_dump() for item in recommended_items],
        "reasoning": reasoning,
    }
    saved_submission = store.save_assessment_submission(_resolve_user_id(current_user), submission_record)

    response = SubmitAssessmentsResponse(
        success=True,
        submitted_at=saved_submission["submitted_at"],
        summary=saved_submission["summary"],
        requires_immediate_attention=saved_submission["requires_immediate_attention"],
        alerts=saved_submission["alerts"],  # type: ignore[arg-type]
        questionnaire_results=saved_submission["questionnaire_results"],  # type: ignore[arg-type]
        recommended_resources=recommended_items,
        reasoning=saved_submission.get("reasoning"),
    )
    return response.model_dump()
