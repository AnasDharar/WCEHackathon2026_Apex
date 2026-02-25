from typing import List, Dict, Any, TypedDict
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_cerebras import ChatCerebras
import json

from schemas.agentschema import AgentRequest, ResourceItem

load_dotenv()

class AgentState(TypedDict):
    qa_pairs: List[str]
    available_resources: List[Dict[str, Any]]
    recommended_resources: List[Dict[str, Any]]

llm = ChatCerebras(
    model="gpt-oss-120b",
    temperature=0.1,  # lower = more accurate filtering
)

async def preprocess_node(state: AgentState) -> AgentState:
    """
    Clean QA text before sending to LLM
    """
    state["qa_pairs"] = [q.strip() for q in state["qa_pairs"] if q]
    return state

async def resource_selection_node(state: AgentState) -> AgentState:
    """
    Select best resources ONLY from available DB resources.
    DO NOT generate new resources.
    """
    user_text = "\n".join(state["qa_pairs"])
    resources = state["available_resources"]

    prompt = f"""
You are a mental wellness recommendation engine.

User Responses:
{user_text}

Available Resources (Database):
{json.dumps(resources, indent=2)}

IMPORTANT RULES:
- You MUST recommend ONLY from the given available resources
- DO NOT create new resources
- DO NOT modify titles
- Select the most relevant 3 to 5 resources
- Match based on emotional needs, stress, anxiety, sleep, etc.
- Return ONLY a JSON list of selected resources
- Copy exact objects from available resources

Output example:
[
  {{
    "title": "Breathing Exercise",
    "type": "exercise",
    "description": "...",
    "tags": ["anxiety"]
  }}
]
"""

    response = await llm.ainvoke(prompt)
    output = response.content.strip()

    try:
        # Try to parse JSON safely
        selected = json.loads(output)
    except Exception:
        selected = []

    # Fallback safety: if LLM fails, return top 3 resources
    if not selected and resources:
        selected = resources[:3]

    state["recommended_resources"] = selected
    return state

def build_agent():
    graph = StateGraph(AgentState)

    graph.add_node("preprocess", preprocess_node)
    graph.add_node("resource_filter", resource_selection_node)

    graph.set_entry_point("preprocess")
    graph.add_edge("preprocess", "resource_filter")
    graph.add_edge("resource_filter", END)

    return graph.compile()


agent_graph = build_agent()

async def run_agent_from_schema(request: AgentRequest) -> List[Dict[str, Any]]:
    """
    Input:
        - Questions & Answers (Pydantic)
        - Resources (from DB)
    Output:
        - ONLY recommended resources from DB
    """

    # Convert QA schema → text
    qa_formatted = [
        f"Question: {qa.question}\nAnswer: {qa.answer}"
        for qa in request.responses
    ]

    # Convert Pydantic resources → dict
    resources_dict = [res.model_dump() for res in request.resources]

    initial_state: AgentState = {
        "qa_pairs": qa_formatted,
        "available_resources": resources_dict,
        "recommended_resources": [],
    }

    result = await agent_graph.ainvoke(initial_state)

    return result["recommended_resources"]