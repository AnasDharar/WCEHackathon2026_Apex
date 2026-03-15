from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import (
    appointments,
    assessments,
    auth,
    chatbot,
    community,
    dashboard,
    events,
    health,
    habits,
    profile,
    resources,
    voice,
)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Backend for Manah Arogya platform. Includes dashboard, habits, chatbot, "
        "resources, appointments, events, and community APIs."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_origin_regex=settings.cors_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(dashboard.router)
app.include_router(habits.router)
app.include_router(chatbot.router)
app.include_router(assessments.router)
app.include_router(resources.router)
app.include_router(resources.compat_router)
app.include_router(appointments.router)
app.include_router(events.router)
app.include_router(events.compat_router)
app.include_router(events.compat_api_router)
app.include_router(community.router)
app.include_router(voice.router)
app.include_router(voice.compat_router)
