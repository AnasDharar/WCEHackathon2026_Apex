from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/")
async def root() -> dict[str, str]:
    return {
        "status": "running",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_env,
    }


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

