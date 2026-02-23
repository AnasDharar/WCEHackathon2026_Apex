from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.community import CreatePostRequest, ReplyPostRequest
from app.services.runtime import store

router = APIRouter(prefix="/api/v1/community", tags=["community"])


@router.get("/stats")
async def get_community_stats() -> dict[str, object]:
    return {"success": True, "data": store.list_community_stats()}


@router.get("/posts")
async def list_posts() -> dict[str, object]:
    return {"success": True, "data": store.list_community_posts()}


@router.post("/posts")
async def create_post(payload: CreatePostRequest) -> dict[str, object]:
    post = store.create_post(author=payload.author, role=payload.role, content=payload.content)
    return {"success": True, "data": post}


@router.post("/posts/{post_id}/like")
async def like_post(post_id: int) -> dict[str, object]:
    try:
        post = store.like_post(post_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"success": True, "data": post}


@router.post("/posts/{post_id}/reply")
async def reply_post(post_id: int, payload: ReplyPostRequest) -> dict[str, object]:
    try:
        post = store.reply_post(post_id, payload.content)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"success": True, "data": post}


@router.get("/groups")
async def list_groups() -> dict[str, object]:
    return {"success": True, "data": store.list_support_groups()}


@router.get("/mentors")
async def list_mentors() -> dict[str, object]:
    return {"success": True, "data": store.list_mentors()}

