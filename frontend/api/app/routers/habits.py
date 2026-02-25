from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from app.routers.deps import get_optional_current_user
from app.schemas.habits import HabitCalendarResponse, HabitCoachRequest, HabitCoachResponse, UpdateHabitRequest
from app.services.langgraph_habit_coach import generate_habit_coach_plan
from app.services.runtime import store

router = APIRouter(prefix="/api/v1/habits", tags=["habits"])


@router.get("/stats")
async def get_habit_stats() -> dict[str, object]:
    return {"success": True, "data": store.list_habit_stats()}


@router.get("/today")
async def get_today_habits() -> dict[str, object]:
    return {"success": True, "data": store.list_today_habits()}


@router.patch("/{habit_id}")
async def update_habit(habit_id: int, payload: UpdateHabitRequest) -> dict[str, object]:
    try:
        habit = store.update_habit(habit_id=habit_id, done=payload.done)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"success": True, "message": "Habit updated successfully.", "data": habit}


@router.get("/weekly-progress")
async def get_weekly_progress() -> dict[str, object]:
    return {"success": True, "data": store.list_weekly_progress()}


@router.get("/category-progress")
async def get_category_progress() -> dict[str, object]:
    return {"success": True, "data": store.list_habit_breakdown()}


@router.get("/calendar")
async def get_habit_calendar(
    year: int = Query(default=datetime.now().year, ge=2000, le=2100),
    month: int = Query(default=datetime.now().month, ge=1, le=12),
) -> dict[str, object]:
    payload = HabitCalendarResponse.model_validate(store.get_habit_calendar(year=year, month=month))
    return {"success": True, "data": payload.model_dump()}


@router.post("/coach")
async def habit_coach(
    payload: HabitCoachRequest,
    current_user: dict[str, object] | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    profile = current_user or store.get_profile()
    user_id = str(profile.get("id", "user-1"))
    plan = await generate_habit_coach_plan(
        message=payload.message,
        profile=profile,
        habit_stats=store.list_habit_stats(),
        habits_today=store.list_today_habits(),
        weekly_progress=store.list_weekly_progress(),
        category_progress=store.list_habit_breakdown(),
        assessment_history=store.get_assessment_history(user_id),
    )
    validated = HabitCoachResponse.model_validate(plan)
    return {"success": True, "data": validated.model_dump()}
