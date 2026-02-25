from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class FeaturedEvent(BaseModel):
    title: str
    date: str
    time: str
    mode: str
    description: str


class EventItem(BaseModel):
    id: int
    title: str
    date: str
    time: str
    host: str
    attendees: int = Field(..., ge=0)
    mode: str
    capacity: int = Field(..., ge=1)
    category: str | None = None
    category_label: str | None = None
    event_type: str | None = None


class WeeklyLineupItem(BaseModel):
    id: int
    day: str
    topic: str
    time: str


class EventRegistrationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    user_name: str | None = Field(default=None, min_length=2, alias="userName")
    user_email: str | None = Field(default=None, min_length=3, alias="userEmail")


class EventRegistrationResponse(BaseModel):
    success: bool = True
    status: str
    message: str
    event: EventItem
