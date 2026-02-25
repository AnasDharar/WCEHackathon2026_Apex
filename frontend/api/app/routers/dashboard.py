from __future__ import annotations

from fastapi import APIRouter, Depends

from app.routers.deps import sync_request_profile
from app.schemas.dashboard import DashboardOverview
from app.services.runtime import store

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/overview")
async def get_dashboard_overview(_: None = Depends(sync_request_profile)) -> dict[str, object]:
    payload = DashboardOverview.model_validate(store.get_dashboard_overview())
    return {"success": True, "data": payload.model_dump()}
