from __future__ import annotations

import re
from datetime import timedelta
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query
from livekit.api import AccessToken, VideoGrants

from app.core.config import settings
from app.schemas.voice import VoiceTokenRequest, VoiceTokenResponse

router = APIRouter(prefix="/api/v1/voice", tags=["voice"])
compat_router = APIRouter(tags=["voice"])


def _slugify_identity(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9_-]+", "-", value.strip().lower())
    normalized = re.sub(r"-{2,}", "-", normalized).strip("-")
    return normalized or "participant"


def _build_token_response(room_name: str, participant_name: str) -> VoiceTokenResponse:
    if not settings.livekit_url or not settings.livekit_api_key or not settings.livekit_api_secret:
        raise HTTPException(
            status_code=500,
            detail="LiveKit server credentials are not configured on the API server.",
        )

    participant_identity = f"{_slugify_identity(participant_name)}-{uuid4().hex[:8]}"
    grant = VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=True,
        can_subscribe=True,
        can_publish_data=True,
        can_publish_sources=["microphone"],
    )
    token = (
        AccessToken(settings.livekit_api_key, settings.livekit_api_secret)
        .with_identity(participant_identity)
        .with_name(participant_name)
        .with_grants(grant)
        .with_ttl(timedelta(minutes=settings.livekit_token_ttl_minutes))
        .to_jwt()
    )

    return VoiceTokenResponse(
        token=token,
        room_name=room_name,
        participant_name=participant_name,
        participant_identity=participant_identity,
        server_url=settings.livekit_url,
        expires_in_seconds=settings.livekit_token_ttl_minutes * 60,
    )


@router.post("/token", response_model=VoiceTokenResponse)
async def create_voice_token(payload: VoiceTokenRequest) -> VoiceTokenResponse:
    return _build_token_response(
        room_name=payload.room_name,
        participant_name=payload.participant_name,
    )


@router.get("/token", response_model=VoiceTokenResponse)
@compat_router.get("/token", response_model=VoiceTokenResponse)
async def get_voice_token(
    room_name: str = Query(..., min_length=3, max_length=80),
    participant_name: str = Query(..., min_length=2, max_length=80),
) -> VoiceTokenResponse:
    payload = VoiceTokenRequest(
        room_name=room_name,
        participant_name=participant_name,
    )
    return _build_token_response(
        room_name=payload.room_name,
        participant_name=payload.participant_name,
    )
