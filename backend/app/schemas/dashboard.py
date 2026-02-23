from __future__ import annotations

from pydantic import BaseModel

from app.schemas.appointments import AppointmentItem
from app.schemas.habits import HabitCalendarDay, HabitItem
from app.schemas.resources import ResourceItem


class AITestResult(BaseModel):
    id: int
    title: str
    score: str
    feedback: str
    date: str


class DashboardOverview(BaseModel):
    welcome_name: str
    test_results: list[AITestResult]
    live_appointments: list[AppointmentItem]
    today_habits: list[HabitItem]
    habit_calendar: list[HabitCalendarDay]
    resource_highlights: list[ResourceItem]

