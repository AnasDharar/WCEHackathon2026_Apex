from __future__ import annotations

import re
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.services.ai import invoke_json_completion

STOPWORDS = {
    "the",
    "a",
    "an",
    "and",
    "or",
    "to",
    "of",
    "in",
    "on",
    "for",
    "is",
    "are",
    "was",
    "were",
    "i",
    "me",
    "my",
    "it",
    "that",
    "this",
    "with",
    "at",
    "as",
    "be",
    "have",
    "has",
    "had",
}


class RecommendationState(TypedDict):
    responses: list[dict[str, str]]
    resources: list[dict[str, Any]]
    max_recommendations: int
    query_terms: list[str]
    ranked_ids: list[int]
    selected_ids: list[int]
    recommended_resources: list[dict[str, Any]]
    reasoning: str


def _tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9-]{1,}", text.lower())
    return [token for token in tokens if token not in STOPWORDS]


def _resource_text(resource: dict[str, Any]) -> str:
    tags = " ".join(resource.get("tags", []))
    fields = [resource.get("title", ""), resource.get("description", ""), resource.get("type", ""), tags]
    return " ".join(str(field) for field in fields).lower()


def _heuristic_rank(resources: list[dict[str, Any]], query_terms: list[str]) -> list[int]:
    scores: list[tuple[int, int]] = []
    for resource in resources:
        resource_id = int(resource["id"])
        text_blob = _resource_text(resource)
        score = 0
        for term in query_terms:
            if term in text_blob:
                score += 2
        for tag in resource.get("tags", []):
            if tag.lower() in query_terms:
                score += 3
        if resource.get("recommended"):
            score += 1
        scores.append((resource_id, score))

    ranked = sorted(scores, key=lambda item: (-item[1], item[0]))
    return [resource_id for resource_id, _ in ranked]


async def preprocess_node(state: RecommendationState) -> RecommendationState:
    responses_text = "\n".join(
        f"Question: {item['question']}\nAnswer: {item['answer']}" for item in state["responses"]
    )
    query_terms = _tokenize(responses_text)
    state["query_terms"] = query_terms
    return state


async def heuristic_rank_node(state: RecommendationState) -> RecommendationState:
    state["ranked_ids"] = _heuristic_rank(state["resources"], state["query_terms"])
    return state


async def llm_refine_node(state: RecommendationState) -> RecommendationState:
    resources_by_id = {int(item["id"]): item for item in state["resources"]}
    ranked_ids = state["ranked_ids"][:8]
    candidates = [resources_by_id[item_id] for item_id in ranked_ids if item_id in resources_by_id]

    if not candidates:
        state["selected_ids"] = []
        state["reasoning"] = "No resources were available for recommendation."
        return state

    prompt = f"""
You are a recommendation filter for a mental wellness platform.
Select the best resources based on user responses.

User responses:
{state["responses"]}

Candidate resources:
{candidates}

Rules:
- Recommend ONLY from candidate resources.
- Return JSON object with keys:
  - selected_resource_ids: list[int]
  - reasoning: short explanation
- Select up to {state["max_recommendations"]} IDs.
"""

    llm_output = await invoke_json_completion(prompt)
    selected_ids: list[int] = []
    reasoning = "Recommended using tag and context relevance."

    if isinstance(llm_output, dict):
        output_ids = llm_output.get("selected_resource_ids")
        if isinstance(output_ids, list):
            for item in output_ids:
                try:
                    candidate_id = int(item)
                except Exception:
                    continue
                if candidate_id in resources_by_id and candidate_id not in selected_ids:
                    selected_ids.append(candidate_id)
        llm_reasoning = llm_output.get("reasoning")
        if isinstance(llm_reasoning, str) and llm_reasoning.strip():
            reasoning = llm_reasoning.strip()

    if not selected_ids:
        selected_ids = ranked_ids[: state["max_recommendations"]]

    state["selected_ids"] = selected_ids[: state["max_recommendations"]]
    state["reasoning"] = reasoning
    return state


async def finalize_node(state: RecommendationState) -> RecommendationState:
    resources_by_id = {int(item["id"]): item for item in state["resources"]}
    selected = [
        resources_by_id[resource_id]
        for resource_id in state["selected_ids"]
        if resource_id in resources_by_id
    ]
    if not selected:
        fallback_ids = state["ranked_ids"][: state["max_recommendations"]]
        selected = [resources_by_id[resource_id] for resource_id in fallback_ids if resource_id in resources_by_id]
    state["recommended_resources"] = selected
    return state


def _build_graph():
    graph = StateGraph(RecommendationState)
    graph.add_node("preprocess", preprocess_node)
    graph.add_node("heuristic_rank", heuristic_rank_node)
    graph.add_node("llm_refine", llm_refine_node)
    graph.add_node("finalize", finalize_node)

    graph.set_entry_point("preprocess")
    graph.add_edge("preprocess", "heuristic_rank")
    graph.add_edge("heuristic_rank", "llm_refine")
    graph.add_edge("llm_refine", "finalize")
    graph.add_edge("finalize", END)
    return graph.compile()


recommendation_graph = _build_graph()


async def recommend_resources_with_langgraph(
    responses: list[dict[str, str]],
    resources: list[dict[str, Any]],
    max_recommendations: int = 5,
) -> tuple[list[dict[str, Any]], str]:
    normalized_resources: list[dict[str, Any]] = []
    for index, resource in enumerate(resources, start=1):
        normalized = dict(resource)
        try:
            normalized["id"] = int(normalized.get("id") or index)
        except Exception:
            normalized["id"] = index
        normalized_resources.append(normalized)

    initial_state: RecommendationState = {
        "responses": responses,
        "resources": normalized_resources,
        "max_recommendations": max_recommendations,
        "query_terms": [],
        "ranked_ids": [],
        "selected_ids": [],
        "recommended_resources": [],
        "reasoning": "",
    }

    result = await recommendation_graph.ainvoke(initial_state)
    recommended = result.get("recommended_resources", [])
    reasoning = result.get("reasoning", "Recommended using contextual relevance.")
    return recommended, reasoning

