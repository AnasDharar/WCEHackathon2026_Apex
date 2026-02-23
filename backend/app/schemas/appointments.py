from __future__ import annotations

from pydantic import BaseModel, Field
from pydantic import model_validator


class AppointmentStat(BaseModel):
    id: int
    label: str
    value: str


class AppointmentItem(BaseModel):
    id: int
    counselor_id: int | None = None
    patient_name: str | None = None
    doctor: str
    specialty: str
    date: str
    time: str
    mode: str
    location: str | None = None
    status: str
    meet_link: str | None = None
    notes: str | None = None


class CounselorItem(BaseModel):
    id: int
    name: str
    specialty: str
    years_experience: int
    languages: list[str]
    rating: float


class BookAppointmentRequest(BaseModel):
    counselor_id: int | None = Field(default=None, ge=1)
    specialist_type: str | None = Field(default=None, min_length=2)
    preferred_slot: str = Field(..., min_length=4)
    mode: str = Field(default="Online")
    location: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=600)

    @model_validator(mode="after")
    def validate_identity(self) -> BookAppointmentRequest:
        if self.counselor_id is None and not self.specialist_type:
            raise ValueError("Either counselor_id or specialist_type is required.")
        return self


class RescheduleAppointmentRequest(BaseModel):
    preferred_slot: str = Field(..., min_length=4)


class AppointmentActionResponse(BaseModel):
    success: bool = True
    message: str
    appointment: AppointmentItem
