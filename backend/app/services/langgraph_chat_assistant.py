from __future__ import annotations

import re
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.services.ai import fallback_chat_reply, get_last_cerebras_error, invoke_cerebras

RISK_KEYWORDS = {
    "suicide",
    "kill myself",
    "hurt myself",
    "self-harm",
    "self harm",
    "better off dead",
    "end my life",
}


class ChatAssistantState(TypedDict):
    user_message: str
    history: list[dict[str, Any]]
    profile: dict[str, Any]
    habits_today: list[dict[str, Any]]
    assessment_history: list[dict[str, Any]]
    context_summary: str
    focus_areas: list[str]
    safety_mode: bool
    prompt: str
    draft_reply: str
    final_reply: str


def _has_risk_signal(text: str) -> bool:
    normalized = text.lower()
    return any(keyword in normalized for keyword in RISK_KEYWORDS)


def _is_high_severity(test_id: str, severity: str) -> bool:
    normalized = severity.strip().lower()
    if test_id == "gad7":
        return normalized in {"moderate", "severe"}
    if test_id == "phq9":
        return normalized in {"moderate", "moderately severe", "severe"}
    if test_id == "pss10":
        return normalized in {"moderate", "high"}
    return False


def _context_from_assessment(history: list[dict[str, Any]]) -> tuple[str, list[str], bool]:
    if not history:
        return "No assessment history found yet.", [], False

    latest = history[0]
    summary = str(latest.get("summary", "Assessment summary unavailable."))
    submitted_at = str(latest.get("submitted_at", "unknown date"))
    results = latest.get("questionnaire_results", [])
    resources = latest.get("recommended_resources", [])
    requires_immediate_attention = bool(latest.get("requires_immediate_attention", False))

    focus_areas: list[str] = []
    result_lines: list[str] = []
    for item in results:
        if not isinstance(item, dict):
            continue
        test_id = str(item.get("test_id", "")).strip()
        title = str(item.get("title", test_id)).strip()
        severity = str(item.get("severity", "Unknown")).strip()
        score = item.get("total_score", "N/A")
        max_score = item.get("max_score", "N/A")
        result_lines.append(f"- {title}: {severity} ({score}/{max_score})")
        if _is_high_severity(test_id, severity):
            focus_areas.append(title)

    resource_titles = [
        str(item.get("title", "")).strip()
        for item in resources
        if isinstance(item, dict) and str(item.get("title", "")).strip()
    ][:3]
    resource_line = ", ".join(resource_titles) if resource_titles else "No resource recommendations available."

    context_summary = (
        f"Latest assessment submitted at {submitted_at}.\n"
        f"Summary: {summary}\n"
        f"Results:\n{chr(10).join(result_lines) if result_lines else '- No detailed scores available.'}\n"
        f"Suggested resources: {resource_line}"
    )
    return context_summary, focus_areas, requires_immediate_attention


def _contextual_fallback_reply(
    user_message: str,
    focus_areas: list[str],
    pending_habits: list[str],
) -> str:
    baseline = fallback_chat_reply(user_message)
    if not focus_areas:
        return baseline

    primary = focus_areas[0]
    habit_hint = pending_habits[0] if pending_habits else "one small wellness action"
    return (
        f"I can see your latest assessment flagged higher load around {primary}. "
        f"Start with one short regulation step now, then complete {habit_hint} today. "
        f"After that, tell me what changed in your stress level from 0-10."
    )


def _sanitize_llm_reply(reply: str) -> str:
    text = reply.strip()
    if not text:
        return text

    text = text.replace("\r\n", "\n")
    text = re.sub(r"```[\s\S]*?```", "", text)
    text = re.sub(r"\*\*(\d+\.)\*\*", r"\1", text)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"__(.*?)__", r"\1", text)
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", text)
    text = re.sub(r"^\s{0,3}#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*[-*]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


async def prepare_context_node(state: ChatAssistantState) -> ChatAssistantState:
    profile = state["profile"]
    habits_today = state["habits_today"]
    history = state["history"][-8:]

    completed_habits = [str(item.get("name", "")).strip() for item in habits_today if item.get("done")]
    pending_habits = [str(item.get("name", "")).strip() for item in habits_today if not item.get("done")]
    conversation_text = "\n".join(
        f"{str(msg.get('role', 'user')).strip()}: {str(msg.get('text', '')).strip()}" for msg in history
    )

    assessment_summary, focus_areas, high_risk_from_assessment = _context_from_assessment(
        state["assessment_history"]
    )
    safety_mode = high_risk_from_assessment or _has_risk_signal(state["user_message"])

    state["focus_areas"] = focus_areas
    state["safety_mode"] = safety_mode
    state["context_summary"] = (
        f"User: {profile.get('first_name', 'User')}\n"
        f"Completed habits today: {completed_habits}\n"
        f"Pending habits today: {pending_habits}\n"
        f"Conversation history:\n{conversation_text if conversation_text else 'No prior messages.'}\n\n"
        f"{assessment_summary}"
    )
    return state


async def build_prompt_node(state: ChatAssistantState) -> ChatAssistantState:
    if state["safety_mode"]:
        state["prompt"] = ""
        return state

    focus_line = ", ".join(state["focus_areas"]) if state["focus_areas"] else "No severe area identified"
    state["prompt"] = f"""
You are a mental wellness recovery assistant.
Use the assessment context to personalize support and avoid generic advice.
Be compassionate, specific, and practical.
Do not diagnose, and do not claim certainty.

Context:
{state["context_summary"]}

Detected focus areas:
{focus_line}

Latest user message:
{state["user_message"]}

Return 4 short parts:
1) One-line validation
2) One focused explanation linking user's message to assessment context
3) A concrete 2-step recovery plan for today
4) One follow-up question
Output format rules:
- Plain text only.
- Do not use markdown symbols like **, __, #, bullet markers, or code blocks.
"""
    return state


async def generate_reply_node(state: ChatAssistantState) -> ChatAssistantState:
    pending_habits = [
        str(item.get("name", "")).strip() for item in state["habits_today"] if not item.get("done")
    ]

    if state["safety_mode"]:
        state["draft_reply"] = (
            "Thanks for sharing this honestly. Your recent responses indicate possible high-risk distress. "
            "Please contact emergency help right now if you may act on self-harm thoughts. "
            "If you are in the US or Canada, call or text 988 immediately. "
            "Would you like me to give you a 60-second grounding step while you contact support?"
        )
        return state

    llm_output = await invoke_cerebras(state["prompt"])
    if llm_output and llm_output.strip():
        state["draft_reply"] = llm_output.strip()
        return state

    fallback_text = _contextual_fallback_reply(
        user_message=state["user_message"],
        focus_areas=state["focus_areas"],
        pending_habits=pending_habits,
    )
    if get_last_cerebras_error():
        state["draft_reply"] = (
            "Live AI model is temporarily unavailable, so I am giving best-effort guided support.\n\n"
            f"{fallback_text}"
        )
    else:
        state["draft_reply"] = fallback_text
    return state


async def finalize_reply_node(state: ChatAssistantState) -> ChatAssistantState:
    reply = state.get("draft_reply", "").strip()
    if not reply:
        reply = _contextual_fallback_reply(
            user_message=state["user_message"],
            focus_areas=state["focus_areas"],
            pending_habits=[str(item.get("name", "")).strip() for item in state["habits_today"] if not item.get("done")],
        )

    reply = _sanitize_llm_reply(reply)

    if len(reply) > 1800:
        reply = reply[:1800].rstrip() + "..."

    state["final_reply"] = reply
    return state


def _build_graph():
    graph = StateGraph(ChatAssistantState)
    graph.add_node("prepare_context", prepare_context_node)
    graph.add_node("build_prompt", build_prompt_node)
    graph.add_node("generate_reply", generate_reply_node)
    graph.add_node("finalize_reply", finalize_reply_node)

    graph.set_entry_point("prepare_context")
    graph.add_edge("prepare_context", "build_prompt")
    graph.add_edge("build_prompt", "generate_reply")
    graph.add_edge("generate_reply", "finalize_reply")
    graph.add_edge("finalize_reply", END)
    return graph.compile()


chat_assistant_graph = _build_graph()


async def generate_chat_reply_with_langgraph(
    user_message: str,
    history: list[dict[str, Any]],
    profile: dict[str, Any],
    habits_today: list[dict[str, Any]],
    assessment_history: list[dict[str, Any]],
) -> str:
    initial_state: ChatAssistantState = {
        "user_message": user_message,
        "history": history,
        "profile": profile,
        "habits_today": habits_today,
        "assessment_history": assessment_history,
        "context_summary": "",
        "focus_areas": [],
        "safety_mode": False,
        "prompt": "",
        "draft_reply": "",
        "final_reply": "",
    }
    result = await chat_assistant_graph.ainvoke(initial_state)
    return str(result.get("final_reply", "")).strip()
