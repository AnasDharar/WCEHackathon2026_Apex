from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class HabitStat(BaseModel):
    id: int
    label: str
    value: str
    note: str


class HabitItem(BaseModel):
    id: int
    name: str
    schedule: str
    done: bool


class WeeklyProgressItem(BaseModel):
    day: str
    done: bool


class HabitCategoryProgress(BaseModel):
    id: int
    name: str
    progress: int = Field(..., ge=0, le=100)


class HabitCalendarDay(BaseModel):
    day: int | None
    completed: bool


class HabitCalendarResponse(BaseModel):
    year: int
    month: int
    days: list[HabitCalendarDay]


class UpdateHabitRequest(BaseModel):
    done: bool


class HabitCoachRequest(BaseModel):
    message: str | None = Field(
        default=None,
        max_length=1000,
        description="Optional user message describing current blocker or goal.",
    )


class HabitCoachResponse(BaseModel):
    success: bool = True
    priority_focus: str
    coach_reply: str
    suggested_actions: List[str] = Field(default_factory=list, max_length=6)
    confidence: float = Field(default=0.6, ge=0, le=1)
