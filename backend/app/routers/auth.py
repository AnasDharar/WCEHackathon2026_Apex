from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.routers.deps import get_bearer_token, get_current_user
from app.schemas.auth import LoginData, LoginRequest, LoginResponse, LogoutResponse
from app.services.runtime import store

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login")
async def login(payload: LoginRequest) -> dict[str, object]:
    try:
        token, user, next_step = store.authenticate_user(payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    response = LoginResponse(
        success=True,
        data=LoginData(
            access_token=token,
            user=user,  # type: ignore[arg-type]
            next_step=next_step,  # type: ignore[arg-type]
        ),
    )
    return response.model_dump()


@router.get("/me")
async def auth_me(current_user: dict[str, object] = Depends(get_current_user)) -> dict[str, object]:
    return {"success": True, "data": current_user}


@router.post("/logout")
async def logout(token: str = Depends(get_bearer_token)) -> dict[str, object]:
    store.invalidate_token(token)
    return LogoutResponse().model_dump()
