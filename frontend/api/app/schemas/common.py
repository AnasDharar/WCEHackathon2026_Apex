from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ApiEnvelope(BaseModel):
    success: bool = True
    data: Any
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class UserProfile(BaseModel):
    id: str
    name: str
    first_name: str
    email: str

