from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.resources import (
    RecommendFromProfileRequest,
    RecommendResourcesRequest,
    RecommendResourcesResponse,
    ResourceItem,
)
from app.services.langgraph_recommender import recommend_resources_with_langgraph
from app.services.runtime import store

router = APIRouter(prefix="/api/v1/resources", tags=["resources"])
compat_router = APIRouter(prefix="/api/v1", tags=["resources"])


@router.get("/categories")
async def get_resource_categories() -> dict[str, object]:
    return {"success": True, "data": store.list_resource_categories()}


@router.get("/library")
async def get_resource_library(
    query: str | None = Query(default=None),
    resource_type: str | None = Query(default=None, alias="type"),
    recommended: bool | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1, le=50),
) -> dict[str, object]:
    resources = store.list_resources(
        query=query,
        resource_type=resource_type,
        recommended=recommended,
        limit=limit,
    )
    return {"success": True, "data": resources}


@router.get("/collections")
async def get_resource_collections() -> dict[str, object]:
    return {"success": True, "data": store.list_resource_collections()}


async def _run_recommendation(payload: RecommendResourcesRequest) -> RecommendResourcesResponse:
    responses = [item.model_dump() for item in payload.responses]
    resources = [item.model_dump() for item in payload.resources]
    recommended, reasoning = await recommend_resources_with_langgraph(
        responses=responses,
        resources=resources,
        max_recommendations=payload.max_recommendations,
    )
    validated_recommended = [ResourceItem.model_validate(item) for item in recommended]
    return RecommendResourcesResponse(
        success=True,
        total_responses=len(payload.responses),
        total_available_resources=len(payload.resources),
        recommended_resources=validated_recommended,
        reasoning=reasoning,
    )


@router.post("/recommendations")
async def recommend_resources(payload: RecommendResourcesRequest) -> dict[str, object]:
    response = await _run_recommendation(payload)
    return response.model_dump()


@compat_router.post("/recommend-resources")
async def recommend_resources_legacy(payload: RecommendResourcesRequest) -> dict[str, object]:
    response = await _run_recommendation(payload)
    return response.model_dump()


@router.post("/recommend-from-profile")
async def recommend_resources_from_profile(payload: RecommendFromProfileRequest) -> dict[str, object]:
    profile_resources = [ResourceItem.model_validate(item) for item in store.list_ai_resource_pool()]
    request_payload = RecommendResourcesRequest(
        responses=payload.responses,
        resources=profile_resources,
        max_recommendations=payload.max_recommendations,
    )
    response = await _run_recommendation(request_payload)
    return response.model_dump()

