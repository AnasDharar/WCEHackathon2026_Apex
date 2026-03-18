from __future__ import annotations

import re
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.services.ai import invoke_cerebras

DIAGNOSIS_KEYWORDS = {
    "diagnose",
    "diagnosis",
    "prescribe",
    "prescription",
    "medicine",
    "medication",
    "bipolar",
    "schizophrenia",
    "clinical depression",
    "disorder",
    "treatment plan",
}

CRISIS_KEYWORDS = {
    "suicide",
    "kill myself",
    "end my life",
    "self harm",
    "self-harm",
    "hurt myself",
}


class MentalHealthVoiceState(TypedDict):
    user_text: str
    conversation_history: list[dict[str, str]]
    safety_blocked: bool
    safety_reason: str
    prompt: str
    draft_response: str
    final_response: str


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _contains_any(text: str, keywords: set[str]) -> bool:
    normalized = text.lower()
    return any(keyword in normalized for keyword in keywords)


async def safety_check_node(state: MentalHealthVoiceState) -> MentalHealthVoiceState:
    user_text = state["user_text"]

    if _contains_any(user_text, CRISIS_KEYWORDS):
        state["safety_blocked"] = True
        state["safety_reason"] = "crisis"
        state["draft_response"] = (
            "तुम्ही सध्या खूप कठीण अवस्थेत आहात असे वाटते. "
            "मी वैद्यकीय आपत्कालीन मदतीची जागा घेऊ शकत नाही. "
            "कृपया लगेच तुमच्या जवळच्या विश्वासू व्यक्तीशी किंवा स्थानिक आपत्कालीन मदतीशी संपर्क करा. "
            "तुम्हाला हवे असल्यास आपण आत्ता दोन शांत श्वास घेण्यापासून सुरुवात करू."
        )
        return state

    if _contains_any(user_text, DIAGNOSIS_KEYWORDS):
        state["safety_blocked"] = True
        state["safety_reason"] = "diagnosis_request"
        state["draft_response"] = (
            "मी वैद्यकीय निदान किंवा औषधांचा सल्ला देऊ शकत नाही. "
            "पण तुमची भावना समजून घेऊन तणाव कमी करण्यासाठी साधे आणि सुरक्षित मार्गदर्शन मराठीत देऊ शकते. "
            "आत्ता तुम्हाला नेमके कशामुळे जड वाटत आहे ते सांगा."
        )
        return state

    state["safety_blocked"] = False
    state["safety_reason"] = ""
    return state


def _route_after_safety(state: MentalHealthVoiceState) -> str:
    return "finalize_response" if state["safety_blocked"] else "response_generation"


async def response_generation_node(state: MentalHealthVoiceState) -> MentalHealthVoiceState:
    history_lines = [
        f"{item.get('role', 'user')}: {item.get('text', '').strip()}"
        for item in state["conversation_history"][-6:]
        if item.get("text")
    ]
    conversation_history = "\n".join(history_lines) if history_lines else "पूर्वीचा संवाद उपलब्ध नाही."

    # State transition: once safety passes, the graph builds a strictly Marathi prompt
    # and generates one empathetic reply for the current user turn.
    state["prompt"] = f"""
तुम्ही एक सहानुभूतीपूर्ण मानसिक आरोग्य सहाय्यक आहात.
खालील कडक नियम पाळा:
- फक्त मराठीत उत्तर द्या.
- उत्तर 3 ते 5 वाक्यांत ठेवा.
- वैद्यकीय निदान, औषधे, किंवा क्लिनिकल खात्री देऊ नका.
- उबदार, शांत, आणि व्यावहारिक शैली ठेवा.
- वापरकर्त्याला एक छोटा श्वसन, grounding, किंवा reflection step द्या.
- शेवटी एक सौम्य follow-up प्रश्न विचारा.

संवादाचा अलीकडचा संदर्भ:
{conversation_history}

वापरकर्त्याचा नवीन संदेश:
{state["user_text"]}
"""

    llm_output = await invoke_cerebras(state["prompt"])
    state["draft_response"] = (llm_output or "").strip()
    return state


async def finalize_response_node(state: MentalHealthVoiceState) -> MentalHealthVoiceState:
    reply = _normalize_text(state.get("draft_response", ""))

    if not reply:
        reply = (
            "मी तुमचं ऐकत आहे. आत्ता एक हळू श्वास घ्या, चार मोजून श्वास आत घ्या आणि सहा मोजून सोडा. "
            "त्यानंतर तुमच्या मनात सध्या सर्वात जास्त कोणती भावना आहे ते मला सांगा."
        )

    # State transition: every path ends here so TTS receives one clean Marathi utterance.
    state["final_response"] = reply[:700].strip()
    return state


def build_mental_health_graph():
    graph = StateGraph(MentalHealthVoiceState)
    graph.add_node("safety_check", safety_check_node)
    graph.add_node("response_generation", response_generation_node)
    graph.add_node("finalize_response", finalize_response_node)

    graph.set_entry_point("safety_check")
    graph.add_conditional_edges(
        "safety_check",
        _route_after_safety,
        {
            "response_generation": "response_generation",
            "finalize_response": "finalize_response",
        },
    )
    graph.add_edge("response_generation", "finalize_response")
    graph.add_edge("finalize_response", END)
    return graph.compile()


mental_health_voice_graph = build_mental_health_graph()


async def generate_voice_reply_with_graph(
    user_text: str,
    conversation_history: list[dict[str, str]] | None = None,
) -> str:
    result = await mental_health_voice_graph.ainvoke(
        MentalHealthVoiceState(
            user_text=user_text.strip(),
            conversation_history=conversation_history or [],
            safety_blocked=False,
            safety_reason="",
            prompt="",
            draft_response="",
            final_response="",
        )
    )
    return str(result.get("final_response", "")).strip()
