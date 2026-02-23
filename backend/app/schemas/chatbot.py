from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ConversationSummary(BaseModel):
    id: int
    title: str
    time: str
    status: Literal["Active", "Resolved"]


class ChatMessage(BaseModel):
    id: int
    conversation_id: int
    role: Literal["assistant", "user", "system"]
    text: str
    time: str


class CreateConversationRequest(BaseModel):
    title: str | None = Field(default=None, max_length=120)


class SendMessageRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=3000)
    use_ai: bool = True


class SendMessageResponse(BaseModel):
    conversation_id: int
    user_message: ChatMessage
    assistant_message: ChatMessage


class ChatInsight(BaseModel):
    id: int
    label: str
    value: str
    tone: str

