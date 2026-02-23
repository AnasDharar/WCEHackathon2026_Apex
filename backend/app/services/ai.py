from __future__ import annotations

import json
import logging
import os
import re
from functools import lru_cache
from typing import Any

from app.core.config import settings

try:
    from langchain_cerebras import ChatCerebras
except Exception:  # pragma: no cover - optional dependency failure at runtime
    ChatCerebras = None  # type: ignore[assignment]


logger = logging.getLogger(__name__)

DEFAULT_CEREBRAS_MODELS = ("gpt-oss-120b", "llama3.1-8b")
_last_cerebras_error: str | None = None
_active_cerebras_model: str | None = None


def _set_last_error(error: str | None) -> None:
    global _last_cerebras_error
    _last_cerebras_error = error


def get_last_cerebras_error() -> str | None:
    return _last_cerebras_error


def _unique_models(models: list[str]) -> list[str]:
    unique: list[str] = []
    for model in models:
        normalized = model.strip()
        if normalized and normalized not in unique:
            unique.append(normalized)
    return unique


def _candidate_models() -> list[str]:
    models: list[str] = []
    if _active_cerebras_model:
        models.append(_active_cerebras_model)
    models.append(settings.cerebras_model)
    models.extend(settings.cerebras_fallback_models)
    models.extend(DEFAULT_CEREBRAS_MODELS)
    return _unique_models(models)


def _normalize_response_content(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and item.get("text"):
                parts.append(str(item["text"]))
        return "\n".join(parts).strip()
    return str(content).strip()


def _extract_json_snippet(text: str) -> str | None:
    fenced_match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text, re.IGNORECASE)
    if fenced_match:
        return fenced_match.group(1).strip()

    object_match = re.search(r"\{[\s\S]*\}", text)
    if object_match:
        return object_match.group(0).strip()

    array_match = re.search(r"\[[\s\S]*\]", text)
    if array_match:
        return array_match.group(0).strip()

    return None


@lru_cache(maxsize=1)
def get_cerebras_llm() -> Any | None:
    return _get_cerebras_llm_for_model(settings.cerebras_model)


@lru_cache(maxsize=8)
def _get_cerebras_llm_for_model(model_name: str) -> Any | None:
    if ChatCerebras is None:
        _set_last_error("langchain-cerebras dependency is not available.")
        return None
    if not settings.cerebras_api_key:
        _set_last_error("CEREBRAS_API_KEY is missing.")
        return None

    os.environ.setdefault("CEREBRAS_API_KEY", settings.cerebras_api_key)
    try:
        return ChatCerebras(
            model=model_name,
            temperature=settings.cerebras_temperature,
        )
    except Exception as exc:
        _set_last_error(f"Failed to initialize Cerebras client for {model_name}: {exc}")
        return None


async def invoke_cerebras(prompt: str) -> str | None:
    global _active_cerebras_model

    if ChatCerebras is None:
        _set_last_error("langchain-cerebras dependency is not available.")
        return None
    if not settings.cerebras_api_key:
        _set_last_error("CEREBRAS_API_KEY is missing.")
        return None

    os.environ.setdefault("CEREBRAS_API_KEY", settings.cerebras_api_key)
    last_error: str | None = None
    for model_name in _candidate_models():
        llm = _get_cerebras_llm_for_model(model_name)
        if llm is None:
            last_error = get_last_cerebras_error() or f"{model_name}: client init failed"
            continue
        try:
            response = await llm.ainvoke(prompt)
            _active_cerebras_model = model_name
            _set_last_error(None)
            return _normalize_response_content(getattr(response, "content", response))
        except Exception as exc:
            last_error = f"{model_name}: {exc}"
            logger.warning("Cerebras invoke failed for model '%s': %s", model_name, exc)
            continue

    _set_last_error(last_error or "Unknown Cerebras invocation error.")
    return None


async def invoke_json_completion(prompt: str) -> Any | None:
    response_text = await invoke_cerebras(prompt)
    if not response_text:
        return None

    try:
        return json.loads(response_text)
    except Exception:
        snippet = _extract_json_snippet(response_text)
        if not snippet:
            return None
        try:
            return json.loads(snippet)
        except Exception:
            return None


def fallback_chat_reply(user_message: str) -> str:
    text = user_message.lower()
    if any(keyword in text for keyword in ("sleep", "insomnia", "night")):
        return (
            "Let us stabilize your sleep tonight. Try a 20-minute wind-down: dim lights, avoid phone, "
            "and do 4-6 breathing for three rounds. If you want, I can create a step-by-step bedtime plan."
        )
    if any(keyword in text for keyword in ("anxious", "anxiety", "panic", "stress", "overloaded")):
        return (
            "Thanks for sharing this. Start with one grounding cycle now: inhale 4, hold 4, exhale 6, repeat 3 times. "
            "Then choose one small task under 15 minutes so your brain gets a quick win."
        )
    if any(keyword in text for keyword in ("focus", "distracted", "procrast")):
        return (
            "To recover focus, run a 15-minute sprint: pick one tiny task, silence notifications, and work until timer ends. "
            "After that, take a 3-minute break and repeat once."
        )
    return (
        "I hear you. We can keep this practical: tell me your top challenge right now and I will give you a short, "
        "2-step plan you can start in the next 5 minutes."
    )


async def generate_chat_reply(
    user_message: str,
    history: list[dict[str, Any]],
    profile: dict[str, Any],
    habits_today: list[dict[str, Any]],
) -> str:
    history_text = "\n".join(f"{msg['role']}: {msg['text']}" for msg in history[-8:])
    completed_habits = [item["name"] for item in habits_today if item.get("done")]
    incomplete_habits = [item["name"] for item in habits_today if not item.get("done")]

    prompt = f"""
You are a mental wellness assistant for students and young professionals.
Be empathetic, concise, and actionable.
Do not diagnose or claim medical certainty.
If the user mentions self-harm or danger, advise immediate professional help and emergency contacts.

User name: {profile.get("first_name", "User")}
Completed habits today: {completed_habits}
Pending habits today: {incomplete_habits}

Conversation history:
{history_text}

Latest user message:
{user_message}

Respond in 3-5 sentences with:
1) emotional validation in one short sentence
2) one practical exercise
3) one optional follow-up question
"""

    llm_reply = await invoke_cerebras(prompt)
    if llm_reply:
        return llm_reply.strip()
    return fallback_chat_reply(user_message)


def _insight_from_completion_rate(completion_rate: int) -> tuple[str, str]:
    if completion_rate >= 80:
        return "Stable", "text-emerald-700 bg-emerald-100"
    if completion_rate >= 60:
        return "Moderate", "text-amber-700 bg-amber-100"
    return "Needs support", "text-rose-700 bg-rose-100"


async def generate_ai_insights(
    habits_today: list[dict[str, Any]],
    weekly_progress: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    done_count = sum(1 for item in habits_today if item.get("done"))
    total_count = max(len(habits_today), 1)
    completion_rate = int((done_count / total_count) * 100)
    weekly_done = sum(1 for item in weekly_progress if item.get("done"))

    prompt = f"""
Return ONLY valid JSON as a list of exactly 3 objects.
Each object must contain: id (int), label (string), value (string), tone (string).

Context:
- Habit completion today: {done_count}/{total_count}
- Completion percent: {completion_rate}
- Weekly completed days: {weekly_done}/7

Allowed labels:
- Mood trend
- Stress level
- Sleep quality

Allowed tone CSS values:
- text-emerald-700 bg-emerald-100
- text-amber-700 bg-amber-100
- text-sky-700 bg-sky-100
- text-rose-700 bg-rose-100
"""

    llm_json = await invoke_json_completion(prompt)
    if isinstance(llm_json, list) and len(llm_json) == 3:
        normalized: list[dict[str, Any]] = []
        for idx, item in enumerate(llm_json, start=1):
            if not isinstance(item, dict):
                break
            label = str(item.get("label", "")).strip()
            value = str(item.get("value", "")).strip()
            tone = str(item.get("tone", "")).strip()
            if label and value and tone:
                normalized.append({"id": idx, "label": label, "value": value, "tone": tone})
        if len(normalized) == 3:
            return normalized

    mood_value, mood_tone = _insight_from_completion_rate(completion_rate)
    stress_value = "Low" if completion_rate >= 80 else "Moderate" if completion_rate >= 60 else "High"
    stress_tone = "text-emerald-700 bg-emerald-100" if stress_value == "Low" else (
        "text-amber-700 bg-amber-100" if stress_value == "Moderate" else "text-rose-700 bg-rose-100"
    )
    sleep_value = "Improving" if weekly_done >= 5 else "Inconsistent"
    sleep_tone = "text-sky-700 bg-sky-100" if weekly_done >= 5 else "text-amber-700 bg-amber-100"

    return [
        {"id": 1, "label": "Mood trend", "value": mood_value, "tone": mood_tone},
        {"id": 2, "label": "Stress level", "value": stress_value, "tone": stress_tone},
        {"id": 3, "label": "Sleep quality", "value": sleep_value, "tone": sleep_tone},
    ]


def get_cerebras_status() -> dict[str, Any]:
    return {
        "provider": "cerebras",
        "dependency_available": ChatCerebras is not None,
        "api_key_present": bool(settings.cerebras_api_key),
        "configured_model": settings.cerebras_model,
        "candidate_models": _candidate_models(),
        "active_model": _active_cerebras_model,
        "last_error": get_last_cerebras_error(),
    }
