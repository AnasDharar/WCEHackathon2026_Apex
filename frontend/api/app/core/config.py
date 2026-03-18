from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _clean_env(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if len(cleaned) >= 2 and ((cleaned[0] == "'" and cleaned[-1] == "'") or (cleaned[0] == '"' and cleaned[-1] == '"')):
        cleaned = cleaned[1:-1].strip()
    return cleaned or None


@dataclass(frozen=True)
class Settings:
    app_name: str = _clean_env(os.getenv("APP_NAME")) or "Manah Arogya Backend API"
    app_version: str = _clean_env(os.getenv("APP_VERSION")) or "2.0.0"
    app_env: str = _clean_env(os.getenv("APP_ENV")) or "development"

    cerebras_api_key: str | None = _clean_env(os.getenv("CEREBRAS_API_KEY"))
    cerebras_model: str = _clean_env(os.getenv("CEREBRAS_MODEL")) or "gpt-oss-120b"
    cerebras_temperature: float = float(_clean_env(os.getenv("CEREBRAS_TEMPERATURE")) or "0.2")
    cerebras_fallback_models_raw: str = (
        _clean_env(os.getenv("CEREBRAS_FALLBACK_MODELS")) or "llama3.1-8b"
    )

    cors_origins_raw: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173",
    )
    cors_allow_origin_regex: str = (
        _clean_env(os.getenv("CORS_ALLOW_ORIGIN_REGEX"))
        or r"https?://(localhost|127\.0\.0\.1)(:\d+)?$"
    )
    livekit_url: str | None = _clean_env(os.getenv("LIVEKIT_URL"))
    livekit_api_key: str | None = _clean_env(os.getenv("LIVEKIT_API_KEY"))
    livekit_api_secret: str | None = _clean_env(os.getenv("LIVEKIT_API_SECRET"))
    livekit_token_ttl_minutes: int = int(_clean_env(os.getenv("LIVEKIT_TOKEN_TTL_MINUTES")) or "60")

    @property
    def cors_origins(self) -> list[str]:
        return _split_csv(self.cors_origins_raw)

    @property
    def cerebras_fallback_models(self) -> list[str]:
        return _split_csv(self.cerebras_fallback_models_raw)


settings = Settings()
