from __future__ import annotations

from pydantic import BaseModel, Field


class CommunityStat(BaseModel):
    id: int
    label: str
    value: str


class CommunityPost(BaseModel):
    id: int
    author: str
    role: str
    time: str
    content: str
    likes: int = Field(..., ge=0)
    comments: int = Field(..., ge=0)


class CreatePostRequest(BaseModel):
    author: str = Field(..., min_length=2)
    role: str = Field(default="Member")
    content: str = Field(..., min_length=5, max_length=1200)


class ReplyPostRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=800)


class SupportGroup(BaseModel):
    id: int
    name: str
    members: int = Field(..., ge=0)
    next: str


class Mentor(BaseModel):
    id: int
    name: str
    specialty: str

