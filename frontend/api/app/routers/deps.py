from __future__ import annotations

from fastapi import Depends, Header, HTTPException

from app.services.runtime import store


def get_bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header.")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Expected Authorization: Bearer <token>.")

    return token.strip()


def get_current_user(token: str = Depends(get_bearer_token)) -> dict[str, object]:
    user = store.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return user


def _clean_header(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def get_optional_current_user(
    authorization: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_name: str | None = Header(default=None, alias="X-User-Name"),
    x_user_first_name: str | None = Header(default=None, alias="X-User-First-Name"),
    x_user_email: str | None = Header(default=None, alias="X-User-Email"),
) -> dict[str, object] | None:
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token.strip():
            user = store.get_user_by_token(token.strip())
            if user:
                return user

    return store.sync_external_identity(
        user_id=_clean_header(x_user_id),
        name=_clean_header(x_user_name),
        first_name=_clean_header(x_user_first_name),
        email=_clean_header(x_user_email),
    )


def sync_request_profile(_: dict[str, object] | None = Depends(get_optional_current_user)) -> None:
    return None
