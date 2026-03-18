from fastapi import Depends, HTTPException
from sqlmodel import Session

from app.database.db import get_session
from app.database.models import Appointment
from app.repositories.appointment_repository import AppointmentRepository


class AppointmentService:
    """Business logic for counseling appointments."""

    def __init__(self, session: Session) -> None:
        """Create service with repository dependencies."""
        self.appointment_repository = AppointmentRepository(session)

    def list_appointments(self, user_id: int) -> list[dict[str, object]]:
        """Return user appointments."""
        appointments = self.appointment_repository.list_by_user(user_id)
        payload: list[dict[str, object]] = []
        for item in appointments:
            slot = item.preferred_slot or ""
            parts = slot.split(" ")
            payload.append(
                {
                    "id": item.id,
                    "doctor": item.counselor_name,
                    "counselor_name": item.counselor_name,
                    "specialty": "Wellness Counseling",
                    "date": parts[0] if parts else slot,
                    "time": " ".join(parts[1:]) if len(parts) > 1 else slot,
                    "preferred_slot": item.preferred_slot,
                    "mode": item.mode,
                    "status": item.status,
                    "notes": item.notes,
                }
            )
        return payload

    def book(self, user_id: int, counselor_name: str, preferred_slot: str, mode: str, location: str | None, notes: str | None) -> Appointment:
        """Book a new appointment."""
        appointment = Appointment(
            user_id=user_id,
            counselor_name=counselor_name,
            preferred_slot=preferred_slot,
            mode=mode,
            location=location,
            notes=notes,
        )
        return self.appointment_repository.create(appointment)

    def reschedule(self, user_id: int, appointment_id: int, preferred_slot: str) -> Appointment:
        """Reschedule an existing appointment."""
        appointment = self.appointment_repository.get_by_id(user_id, appointment_id)
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found.")
        appointment.preferred_slot = preferred_slot
        appointment.status = "rescheduled"
        return self.appointment_repository.save(appointment)

    def stats(self, user_id: int) -> dict[str, int]:
        """Return appointment counts by status."""
        appointments = self.appointment_repository.list_by_user(user_id)
        booked = sum(1 for item in appointments if item.status == "booked")
        rescheduled = sum(1 for item in appointments if item.status == "rescheduled")
        return {"total": len(appointments), "booked": booked, "rescheduled": rescheduled}

    def counselors(self) -> list[dict[str, object]]:
        """Return static counselor directory."""
        return [
            {
                "id": 1,
                "name": "Dr. Asha Menon",
                "specialty": "Anxiety and Stress",
                "rating": 4.8,
                "years_experience": 9,
                "languages": ["English", "Hindi"],
            },
            {
                "id": 2,
                "name": "Dr. Rohan Iyer",
                "specialty": "Academic Burnout",
                "rating": 4.7,
                "years_experience": 7,
                "languages": ["English", "Marathi"],
            },
        ]

    def open_slots(self) -> list[str]:
        """Return sample appointment slots."""
        return ["Monday 10:00 AM", "Tuesday 2:30 PM", "Thursday 11:00 AM"]

    def prep_checklist(self) -> list[str]:
        """Return pre-appointment checklist."""
        return ["Bring key concerns", "Carry any medications list", "Join 5 minutes early"]


def get_appointment_service(session: Session = Depends(get_session)) -> AppointmentService:
    """FastAPI dependency for AppointmentService."""
    return AppointmentService(session)
