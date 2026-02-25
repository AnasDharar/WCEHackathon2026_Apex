from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.schemas.events import EventRegistrationRequest, EventRegistrationResponse
from app.services.runtime import store

router = APIRouter(prefix="/api/v1/events", tags=["events"])
compat_router = APIRouter(prefix="/events", tags=["events"])
compat_api_router = APIRouter(prefix="/api/events", tags=["events"])


def _event_action_response(status: str, message: str, event: dict[str, object]) -> dict[str, object]:
    response = EventRegistrationResponse(success=True, status=status, message=message, event=event).model_dump()
    response["data"] = {"status": status, "message": message, "event": event}
    return response


def _register(event_id: int, waitlist_only: bool) -> dict[str, object]:
    try:
        status, message, event = store.register_event(event_id=event_id, waitlist_only=waitlist_only)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return _event_action_response(status=status, message=message, event=event)


def _resolve_category(
    category: str | None,
    event_type: str | None,
    type_filter: str | None,
    tab: str | None,
) -> str | None:
    for value in (category, event_type, type_filter, tab):
        if value and value.strip():
            return value.strip()
    return None


def _category_slices() -> dict[str, list[dict[str, object]]]:
    workshops = store.list_upcoming_events(category="workshop")
    masterclasses = store.list_upcoming_events(category="masterclass")
    community_circles = store.list_upcoming_events(category="community-circle")
    return {
        "workshops": workshops,
        "masterclasses": masterclasses,
        "community_circles": community_circles,
        "communityCircles": community_circles,
    }


def _featured_payload() -> dict[str, object]:
    featured = store.get_featured_event()
    return {"success": True, "data": featured, "event": featured}


def _upcoming_payload(category: str | None = None) -> dict[str, object]:
    upcoming = store.list_upcoming_events(category=category)
    slices = _category_slices()
    return {
        "success": True,
        "active_category": category,
        "activeCategory": category,
        "data": upcoming,
        "events": upcoming,
        "upcoming": upcoming,
        **slices,
    }


def _weekly_payload() -> dict[str, object]:
    weekly = store.list_weekly_lineup()
    return {"success": True, "data": weekly, "weekly_lineup": weekly, "weeklyLineup": weekly}


def _events_overview_payload(category: str | None = None) -> dict[str, object]:
    featured = store.get_featured_event()
    all_upcoming = store.list_upcoming_events()
    upcoming = store.list_upcoming_events(category=category) if category else all_upcoming
    weekly_lineup = store.list_weekly_lineup()
    slices = _category_slices()
    return {
        "success": True,
        "active_category": category,
        "activeCategory": category,
        "featured": featured,
        "upcoming": upcoming,
        "events": upcoming,
        "all_events": all_upcoming,
        "weekly_lineup": weekly_lineup,
        "weeklyLineup": weekly_lineup,
        **slices,
        "data": {
            "featured": featured,
            "upcoming": upcoming,
            "weekly_lineup": weekly_lineup,
            **slices,
        },
    }


def _reserve_payload(event_id: int) -> dict[str, object]:
    return _register(event_id=event_id, waitlist_only=False)


def _waitlist_payload(event_id: int) -> dict[str, object]:
    return _register(event_id=event_id, waitlist_only=True)


@router.get("")
async def get_events_overview(
    category: str | None = Query(default=None),
    event_type: str | None = Query(default=None, alias="eventType"),
    type_filter: str | None = Query(default=None, alias="type"),
    tab: str | None = Query(default=None),
) -> dict[str, object]:
    active_category = _resolve_category(category=category, event_type=event_type, type_filter=type_filter, tab=tab)
    return _events_overview_payload(category=active_category)


@router.get("/featured")
@router.get("/featured-event")
async def get_featured_event() -> dict[str, object]:
    return _featured_payload()


@router.get("/upcoming")
@router.get("/upcoming-events")
async def get_upcoming_events(
    category: str | None = Query(default=None),
    event_type: str | None = Query(default=None, alias="eventType"),
    type_filter: str | None = Query(default=None, alias="type"),
    tab: str | None = Query(default=None),
) -> dict[str, object]:
    active_category = _resolve_category(category=category, event_type=event_type, type_filter=type_filter, tab=tab)
    return _upcoming_payload(category=active_category)


@router.get("/workshops")
async def get_workshops() -> dict[str, object]:
    return _upcoming_payload(category="workshop")


@router.get("/masterclasses")
async def get_masterclasses() -> dict[str, object]:
    return _upcoming_payload(category="masterclass")


@router.get("/community-circles")
@router.get("/community_circles")
@router.get("/circles")
async def get_community_circles() -> dict[str, object]:
    return _upcoming_payload(category="community-circle")


@router.get("/weekly-lineup")
@router.get("/weekly_lineup")
@router.get("/weekly")
async def get_weekly_lineup() -> dict[str, object]:
    return _weekly_payload()


@router.post("/{event_id}/reserve")
@router.post("/{event_id}/book")
@router.post("/{event_id}/join")
async def reserve_event(event_id: int, _: EventRegistrationRequest | None = None) -> dict[str, object]:
    return _reserve_payload(event_id=event_id)


@router.post("/{event_id}/waitlist")
@router.post("/{event_id}/join-waitlist")
@router.post("/{event_id}/wait-list")
async def join_waitlist(event_id: int, _: EventRegistrationRequest | None = None) -> dict[str, object]:
    return _waitlist_payload(event_id=event_id)


@router.post("/{event_id}/register")
async def register_event(event_id: int, payload: EventRegistrationRequest | None = None) -> dict[str, object]:
    _ = payload
    return _reserve_payload(event_id=event_id)


@compat_router.get("")
async def get_events_overview_legacy(
    category: str | None = Query(default=None),
    event_type: str | None = Query(default=None, alias="eventType"),
    type_filter: str | None = Query(default=None, alias="type"),
    tab: str | None = Query(default=None),
) -> dict[str, object]:
    active_category = _resolve_category(category=category, event_type=event_type, type_filter=type_filter, tab=tab)
    return _events_overview_payload(category=active_category)


@compat_router.get("/featured")
@compat_router.get("/featured-event")
async def get_featured_event_legacy() -> dict[str, object]:
    return _featured_payload()


@compat_router.get("/upcoming")
@compat_router.get("/upcoming-events")
async def get_upcoming_events_legacy(
    category: str | None = Query(default=None),
    event_type: str | None = Query(default=None, alias="eventType"),
    type_filter: str | None = Query(default=None, alias="type"),
    tab: str | None = Query(default=None),
) -> dict[str, object]:
    active_category = _resolve_category(category=category, event_type=event_type, type_filter=type_filter, tab=tab)
    return _upcoming_payload(category=active_category)


@compat_router.get("/workshops")
async def get_workshops_legacy() -> dict[str, object]:
    return _upcoming_payload(category="workshop")


@compat_router.get("/masterclasses")
async def get_masterclasses_legacy() -> dict[str, object]:
    return _upcoming_payload(category="masterclass")


@compat_router.get("/community-circles")
@compat_router.get("/community_circles")
@compat_router.get("/circles")
async def get_community_circles_legacy() -> dict[str, object]:
    return _upcoming_payload(category="community-circle")


@compat_router.get("/weekly-lineup")
@compat_router.get("/weekly_lineup")
@compat_router.get("/weekly")
async def get_weekly_lineup_legacy() -> dict[str, object]:
    return _weekly_payload()


@compat_router.post("/{event_id}/reserve")
@compat_router.post("/{event_id}/register")
@compat_router.post("/{event_id}/book")
@compat_router.post("/{event_id}/join")
async def reserve_event_legacy(event_id: int, _: EventRegistrationRequest | None = None) -> dict[str, object]:
    return _reserve_payload(event_id=event_id)


@compat_router.post("/{event_id}/waitlist")
@compat_router.post("/{event_id}/join-waitlist")
@compat_router.post("/{event_id}/wait-list")
async def join_waitlist_legacy(event_id: int, _: EventRegistrationRequest | None = None) -> dict[str, object]:
    return _waitlist_payload(event_id=event_id)


@compat_api_router.get("")
async def get_events_overview_api_legacy(
    category: str | None = Query(default=None),
    event_type: str | None = Query(default=None, alias="eventType"),
    type_filter: str | None = Query(default=None, alias="type"),
    tab: str | None = Query(default=None),
) -> dict[str, object]:
    active_category = _resolve_category(category=category, event_type=event_type, type_filter=type_filter, tab=tab)
    return _events_overview_payload(category=active_category)


@compat_api_router.get("/featured")
@compat_api_router.get("/featured-event")
async def get_featured_event_api_legacy() -> dict[str, object]:
    return _featured_payload()


@compat_api_router.get("/upcoming")
@compat_api_router.get("/upcoming-events")
async def get_upcoming_events_api_legacy(
    category: str | None = Query(default=None),
    event_type: str | None = Query(default=None, alias="eventType"),
    type_filter: str | None = Query(default=None, alias="type"),
    tab: str | None = Query(default=None),
) -> dict[str, object]:
    active_category = _resolve_category(category=category, event_type=event_type, type_filter=type_filter, tab=tab)
    return _upcoming_payload(category=active_category)


@compat_api_router.get("/workshops")
async def get_workshops_api_legacy() -> dict[str, object]:
    return _upcoming_payload(category="workshop")


@compat_api_router.get("/masterclasses")
async def get_masterclasses_api_legacy() -> dict[str, object]:
    return _upcoming_payload(category="masterclass")


@compat_api_router.get("/community-circles")
@compat_api_router.get("/community_circles")
@compat_api_router.get("/circles")
async def get_community_circles_api_legacy() -> dict[str, object]:
    return _upcoming_payload(category="community-circle")


@compat_api_router.get("/weekly-lineup")
@compat_api_router.get("/weekly_lineup")
@compat_api_router.get("/weekly")
async def get_weekly_lineup_api_legacy() -> dict[str, object]:
    return _weekly_payload()


@compat_api_router.post("/{event_id}/reserve")
@compat_api_router.post("/{event_id}/register")
@compat_api_router.post("/{event_id}/book")
@compat_api_router.post("/{event_id}/join")
async def reserve_event_api_legacy(event_id: int, _: EventRegistrationRequest | None = None) -> dict[str, object]:
    return _reserve_payload(event_id=event_id)


@compat_api_router.post("/{event_id}/waitlist")
@compat_api_router.post("/{event_id}/join-waitlist")
@compat_api_router.post("/{event_id}/wait-list")
async def join_waitlist_api_legacy(event_id: int, _: EventRegistrationRequest | None = None) -> dict[str, object]:
    return _waitlist_payload(event_id=event_id)
