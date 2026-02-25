from pydantic import BaseModel, Field
from typing import List


class QuestionAnswer(BaseModel):
    question: str = Field(..., description="Mental health test question")
    answer: str = Field(..., description="User's answer")


class ResourceItem(BaseModel):
    title: str
    type: str  # video | blog | exercise | guide
    description: str
    tags: List[str] = []  # VERY IMPORTANT for matching


class AgentRequest(BaseModel):
    responses: List[QuestionAnswer] = Field(
        ...,
        description="List of question-answer pairs",
        min_items=1
    )
    resources: List[ResourceItem] = Field(
        ...,
        description="Available resources from database"
    )