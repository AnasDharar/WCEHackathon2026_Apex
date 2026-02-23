from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class QuestionAnswer(BaseModel):
    question: str = Field(..., description="User question asked in an assessment/check-in.")
    answer: str = Field(..., description="User answer.")


class ResourceItem(BaseModel):
    id: int | None = Field(default=None, description="Optional internal resource id.")
    title: str
    type: str
    description: str
    tags: List[str] = Field(default_factory=list)
    duration: str | None = None
    level: str | None = None
    author: str | None = None
    source: str | None = None
    url: str | None = None
    thumbnail_url: str | None = None
    recommended: bool = False


class ResourceCategory(BaseModel):
    id: int
    name: str
    count: int
    tone: str


class ResourceCollection(BaseModel):
    id: int
    name: str
    items: int


class RecommendResourcesRequest(BaseModel):
    responses: List[QuestionAnswer] = Field(
        ...,
        min_length=1,
        description="Question-answer pairs from assessments/check-ins.",
    )
    resources: List[ResourceItem] = Field(
        ...,
        min_length=1,
        description="Candidate resources that recommendation can select from.",
    )
    max_recommendations: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Upper bound for returned recommendations.",
    )


class RecommendFromProfileRequest(BaseModel):
    responses: List[QuestionAnswer] = Field(..., min_length=1)
    max_recommendations: int = Field(default=5, ge=1, le=10)


class RecommendResourcesResponse(BaseModel):
    success: bool = True
    total_responses: int
    total_available_resources: int
    recommended_resources: List[ResourceItem]
    reasoning: str | None = None
