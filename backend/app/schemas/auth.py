from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)
    password: str = Field(..., min_length=4, max_length=200)


class AuthUser(BaseModel):
    id: str
    name: str
    first_name: str
    email: str
    onboarding_complete: bool = False


class LoginData(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser
    next_step: Literal["assessment", "dashboard"]


class LoginResponse(BaseModel):
    success: bool = True
    data: LoginData


class LogoutResponse(BaseModel):
    success: bool = True
    message: str = "Logged out successfully."
