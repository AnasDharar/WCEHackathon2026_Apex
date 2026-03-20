from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AppointmentBookRequest(BaseModel):
    """Payload to book an appointment."""

    counselor_name: str
    preferred_slot: str
    mode: str = "Online"
    location: str | None = None
    notes: str | None = None


class RescheduleRequest(BaseModel):
    """Payload to reschedule an appointment."""

    preferred_slot: str


class AppointmentResponse(BaseModel):
    """Appointment response schema."""

    id: int
    user_id: int
    counselor_name: str
    preferred_slot: str
    mode: str
    location: str | None
    notes: str | None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
