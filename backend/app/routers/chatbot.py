from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.routers.deps import get_optional_current_user
from app.schemas.chatbot import CreateConversationRequest, SendMessageRequest, SendMessageResponse
from app.services.ai import fallback_chat_reply, generate_ai_insights, get_cerebras_status
from app.services.langgraph_chat_assistant import generate_chat_reply_with_langgraph
from app.services.runtime import store

router = APIRouter(prefix="/api/v1/chatbot", tags=["chatbot"])


@router.get("/conversations")
async def list_conversations(_: dict[str, object] | None = Depends(get_optional_current_user)) -> dict[str, object]:
    return {"success": True, "data": store.list_conversations()}


@router.post("/conversations")
async def create_conversation(
    payload: CreateConversationRequest,
    _: dict[str, object] | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    conversation = store.create_conversation(title=payload.title)
    return {"success": True, "data": conversation}


@router.get("/conversations/{conversation_id}/messages")
async def list_messages(
    conversation_id: int,
    _: dict[str, object] | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    try:
        messages = store.list_messages(conversation_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"success": True, "data": messages}


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    payload: SendMessageRequest,
    current_user: dict[str, object] | None = Depends(get_optional_current_user),
) -> dict[str, object]:
    try:
        user_message = store.add_message(conversation_id=conversation_id, role="user", text=payload.text)
        history = store.list_recent_history(conversation_id=conversation_id, limit=8)
        profile = current_user or store.get_profile()
        habits_today = store.list_today_habits()
        user_id = str(profile.get("id", "user-1"))
        assessment_history = store.get_assessment_history(user_id)

        if payload.use_ai:
            try:
                assistant_text = await generate_chat_reply_with_langgraph(
                    user_message=payload.text,
                    history=history,
                    profile=profile,
                    habits_today=habits_today,
                    assessment_history=assessment_history,
                )
            except Exception:
                assistant_text = fallback_chat_reply(payload.text)
        else:
            assistant_text = fallback_chat_reply(payload.text)

        assistant_message = store.add_message(
            conversation_id=conversation_id,
            role="assistant",
            text=assistant_text,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    response = SendMessageResponse(
        conversation_id=conversation_id,
        user_message=user_message,  # type: ignore[arg-type]
        assistant_message=assistant_message,  # type: ignore[arg-type]
    )
    return {"success": True, "data": response.model_dump()}


@router.get("/quick-prompts")
async def get_quick_prompts(_: dict[str, object] | None = Depends(get_optional_current_user)) -> dict[str, object]:
    return {"success": True, "data": store.list_quick_prompts()}


@router.get("/insights")
async def get_chat_insights(_: dict[str, object] | None = Depends(get_optional_current_user)) -> dict[str, object]:
    return {"success": True, "data": store.get_chat_insights()}


@router.post("/insights/refresh")
async def refresh_chat_insights(_: dict[str, object] | None = Depends(get_optional_current_user)) -> dict[str, object]:
    habits_today = store.list_today_habits()
    weekly_progress = store.list_weekly_progress()
    insights = await generate_ai_insights(habits_today=habits_today, weekly_progress=weekly_progress)
    updated = store.set_chat_insights(insights)
    return {"success": True, "data": updated}


@router.get("/llm-status")
async def get_llm_status(_: dict[str, object] | None = Depends(get_optional_current_user)) -> dict[str, object]:
    return {"success": True, "data": get_cerebras_status()}
