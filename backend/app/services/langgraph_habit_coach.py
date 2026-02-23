from __future__ import annotations

import re
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.services.ai import fallback_chat_reply, invoke_json_completion


class HabitCoachState(TypedDict):
    message: str
    profile: dict[str, Any]
    habit_stats: list[dict[str, Any]]
    habits_today: list[dict[str, Any]]
    weekly_progress: list[dict[str, Any]]
    category_progress: list[dict[str, Any]]
    assessment_history: list[dict[str, Any]]
    context_summary: str
    priority_focus: str
    suggested_actions: list[str]
    coach_reply: str
    confidence: float


def _sanitize_text(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"\*\*(.*?)\*\*", r"\1", cleaned)
    cleaned = re.sub(r"__(.*?)__", r"\1", cleaned)
    cleaned = re.sub(r"`([^`]*)`", r"\1", cleaned)
    cleaned = re.sub(r"^\s*[-*]\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def _fallback_plan(state: HabitCoachState) -> tuple[str, str, list[str], float]:
    pending = [item["name"] for item in state["habits_today"] if not item.get("done")]
    completed = [item["name"] for item in state["habits_today"] if item.get("done")]
    weekly_done = sum(1 for item in state["weekly_progress"] if item.get("done"))

    if pending:
        priority_focus = pending[0]
    elif completed:
        priority_focus = "Consistency maintenance"
    else:
        priority_focus = "Daily routine reset"

    actions: list[str] = []
    if pending:
        actions.append(f"Complete '{pending[0]}' in the next 2 hours.")
    actions.append("Use a 10-minute timer and start with the smallest next step.")
    actions.append("After completion, mark habit status in the tracker to reinforce momentum.")
    if weekly_done < 5:
        actions.append("Pick one fixed time slot daily to reduce missed routine days.")

    reply = (
        f"Your current focus should be {priority_focus}. "
        "Keep today practical: one small action, one immediate completion, then lock tomorrow's time block."
    )
    return priority_focus, reply, actions[:6], 0.58


def _build_context(state: HabitCoachState) -> str:
    pending = [item["name"] for item in state["habits_today"] if not item.get("done")]
    completed = [item["name"] for item in state["habits_today"] if item.get("done")]
    weekly_done = sum(1 for item in state["weekly_progress"] if item.get("done"))
    top_category = ""
    if state["category_progress"]:
        top = max(state["category_progress"], key=lambda item: int(item.get("progress", 0)))
        top_category = f"{top.get('name', 'Unknown')} ({top.get('progress', 0)}%)"

    assessment_line = "No assessment context available."
    if state["assessment_history"]:
        latest = state["assessment_history"][0]
        assessment_line = str(latest.get("summary", "Assessment context available but summary missing."))

    return (
        f"User: {state['profile'].get('first_name', 'User')}\n"
        f"User message: {state['message'] or 'No custom message'}\n"
        f"Completed habits: {completed}\n"
        f"Pending habits: {pending}\n"
        f"Weekly done days: {weekly_done}/7\n"
        f"Top category: {top_category or 'N/A'}\n"
        f"Assessment summary: {assessment_line}"
    )


def _normalize_actions(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    actions: list[str] = []
    for item in value:
        text = _sanitize_text(str(item))
        if text and text not in actions:
            actions.append(text)
    return actions[:6]


async def prepare_node(state: HabitCoachState) -> HabitCoachState:
    state["context_summary"] = _build_context(state)
    return state


async def llm_node(state: HabitCoachState) -> HabitCoachState:
    prompt = f"""
You are a habit coach for a mental wellness app.
Use the given context to create a concrete, realistic plan.
Return ONLY JSON object with keys:
- priority_focus: string
- coach_reply: string (2-4 short sentences, plain text, no markdown)
- suggested_actions: list[string] (3 to 6 items, short and actionable)
- confidence: number between 0 and 1

Context:
{state["context_summary"]}
"""
    response = await invoke_json_completion(prompt)
    if isinstance(response, dict):
        priority_focus = _sanitize_text(str(response.get("priority_focus", "")))
        coach_reply = _sanitize_text(str(response.get("coach_reply", "")))
        actions = _normalize_actions(response.get("suggested_actions"))
        try:
            confidence = float(response.get("confidence", 0.64))
        except Exception:
            confidence = 0.64
        confidence = max(0.0, min(confidence, 1.0))

        if priority_focus and coach_reply and actions:
            state["priority_focus"] = priority_focus
            state["coach_reply"] = coach_reply
            state["suggested_actions"] = actions
            state["confidence"] = confidence
            return state

    priority_focus, reply, actions, confidence = _fallback_plan(state)
    state["priority_focus"] = _sanitize_text(priority_focus)
    state["coach_reply"] = _sanitize_text(reply)
    state["suggested_actions"] = [_sanitize_text(item) for item in actions]
    state["confidence"] = confidence
    return state


async def finalize_node(state: HabitCoachState) -> HabitCoachState:
    if not state.get("coach_reply"):
        state["coach_reply"] = _sanitize_text(fallback_chat_reply(state["message"] or "Need habit support"))
    if not state.get("priority_focus"):
        state["priority_focus"] = "Routine consistency"
    if not state.get("suggested_actions"):
        state["suggested_actions"] = [
            "Pick one pending habit and finish it in the next 30 minutes.",
            "Set a fixed reminder time for tomorrow.",
            "Mark completion in the tracker immediately after finishing.",
        ]
    state["coach_reply"] = _sanitize_text(state["coach_reply"])
    state["priority_focus"] = _sanitize_text(state["priority_focus"])
    state["suggested_actions"] = [_sanitize_text(item) for item in state["suggested_actions"] if _sanitize_text(item)]
    return state


def _build_graph():
    graph = StateGraph(HabitCoachState)
    graph.add_node("prepare", prepare_node)
    graph.add_node("llm", llm_node)
    graph.add_node("finalize", finalize_node)

    graph.set_entry_point("prepare")
    graph.add_edge("prepare", "llm")
    graph.add_edge("llm", "finalize")
    graph.add_edge("finalize", END)
    return graph.compile()


habit_coach_graph = _build_graph()


async def generate_habit_coach_plan(
    message: str | None,
    profile: dict[str, Any],
    habit_stats: list[dict[str, Any]],
    habits_today: list[dict[str, Any]],
    weekly_progress: list[dict[str, Any]],
    category_progress: list[dict[str, Any]],
    assessment_history: list[dict[str, Any]],
) -> dict[str, Any]:
    initial_state: HabitCoachState = {
        "message": (message or "").strip(),
        "profile": profile,
        "habit_stats": habit_stats,
        "habits_today": habits_today,
        "weekly_progress": weekly_progress,
        "category_progress": category_progress,
        "assessment_history": assessment_history,
        "context_summary": "",
        "priority_focus": "",
        "suggested_actions": [],
        "coach_reply": "",
        "confidence": 0.6,
    }
    result = await habit_coach_graph.ainvoke(initial_state)
    return {
        "success": True,
        "priority_focus": result.get("priority_focus", "Routine consistency"),
        "coach_reply": result.get("coach_reply", ""),
        "suggested_actions": result.get("suggested_actions", []),
        "confidence": float(result.get("confidence", 0.6)),
    }
