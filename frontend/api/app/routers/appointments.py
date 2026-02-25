from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.routers.deps import get_optional_current_user
from app.schemas.appointments import (
    AppointmentActionResponse,
    CounselorItem,
    AppointmentItem,
    BookAppointmentRequest,
    RescheduleAppointmentRequest,
)
from app.services.runtime import store

router = APIRouter(prefix="/api/v1/appointments", tags=["appointments"])


@router.get("/counselors")
async def get_counselors(
    language: str | None = Query(default=None),
    _: dict[str, object] | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    counselors = [CounselorItem.model_validate(item).model_dump() for item in store.list_counselors(language=language)]
    return {"success": True, "data": counselors}


@router.get("/stats")
async def get_appointment_stats(_: dict[str, object] | None = Depends(get_optional_current_user)) -> dict[str, object]:
    return {"success": True, "data": store.list_appointment_stats()}


@router.get("/upcoming")
async def get_upcoming_appointments(_: dict[str, object] | None = Depends(get_optional_current_user)) -> dict[str, object]:
    return {"success": True, "data": store.list_appointments()}


@router.get("/open-slots")
async def get_open_slots(_: dict[str, object] | None = Depends(get_optional_current_user)) -> dict[str, object]:
    return {"success": True, "data": store.list_open_slots()}


@router.get("/prep-checklist")
async def get_prep_checklist(_: dict[str, object] | None = Depends(get_optional_current_user)) -> dict[str, object]:
    return {"success": True, "data": store.list_prep_checklist()}


@router.post("/book")
async def book_appointment(
    payload: BookAppointmentRequest,
    _: dict[str, object] | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    try:
        appointment = store.book_appointment(
            counselor_id=payload.counselor_id,
            specialist_type=payload.specialist_type,
            preferred_slot=payload.preferred_slot,
            mode=payload.mode,
            location=payload.location,
            notes=payload.notes,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    response = AppointmentActionResponse(
        success=True,
        message="Appointment booking request submitted.",
        appointment=AppointmentItem.model_validate(appointment),
    )
    return response.model_dump()


@router.post("/{appointment_id}/reschedule")
async def reschedule_appointment(
    appointment_id: int,
    payload: RescheduleAppointmentRequest,
    _: dict[str, object] | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    try:
        appointment = store.reschedule_appointment(appointment_id, payload.preferred_slot)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    response = AppointmentActionResponse(
        success=True,
        message="Appointment rescheduled successfully.",
        appointment=AppointmentItem.model_validate(appointment),
    )
    return response.model_dump()
