from __future__ import annotations

from fastapi import APIRouter, Depends

from app.routers.deps import get_optional_current_user
from app.services.runtime import store

router = APIRouter(prefix="/api/v1/users", tags=["profile"])


@router.get("/me")
async def get_me(current_user: dict[str, object] | None = Depends(get_optional_current_user)) -> dict[str, object]:
    return {"success": True, "data": current_user or store.get_profile()}
