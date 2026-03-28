import os
import json
import re
import anthropic
from app.utils.logger import get_logger

logger = get_logger("planner")

MODULE_TOOLS = {
    "devops": ["github", "jira", "slack"],
    "finops": ["slack", "sheets"],
    "pricing": ["sheets", "slack"],
    "talent": ["github", "slack"],
    "supply_chain": ["sheets", "slack"],
    "geospatial": ["sheets", "slack"],
}

MODULE_DESCRIPTIONS = {
    "devops": "DevOps triage: read GitHub issues, classify severity, label issues, create Jira tickets, notify Slack.",
    "finops": "Cloud FinOps: analyse cost data from Sheets, detect anomalies, forecast spend, post summary to Slack.",
    "pricing": "Dynamic Pricing: read competitor prices from Sheets, calculate optimal price, append recommendation, alert Slack.",
    "talent": "Talent Intelligence: parse job descriptions, search GitHub profiles for matching skills, score candidates, post shortlist to Slack.",
    "supply_chain": "Supply Chain: read demand data from Sheets, generate forecast, run risk scenarios, post summary to Slack.",
    "geospatial": "GeoSpatial analysis: analyse location data, score site suitability, export to Sheets, post summary to Slack.",
}

SYSTEM_PROMPT = """You are a workflow planner for an agentic automation platform.

Given a user request and a module type, return a valid JSON DAG of steps to execute.

Each step must follow this exact schema:
{{
  "id": "n1",
  "label": "Human readable step name",
  "tool": "github|jira|slack|sheets|none",
  "action": "function_name_to_call",
  "params": {{"key": "value"}},
  "depends_on": [],
  "requires_approval": false
}}

Rules:
- Use only the tools available for this module: {tools}
- The module context is: {module_desc}
- Return ONLY a JSON array of steps — no markdown, no explanation, no code fences.
- First step depends_on = []. Each subsequent step depends on the relevant prior steps.
- Set requires_approval=true only for destructive actions (closing, deleting, bulk-updating).
- Action names must match actual tool functions: read_issue, add_label, post_comment, create_ticket, set_priority, link_issue, post_message, tag_user, get_channel_id, read_range, append_row.
- Generate 3 to 6 steps. Keep it realistic for the input.
- params must contain plausible values inferred from the user input.
"""


async def generate_dag(user_input: str, module: str) -> list[dict]:
    """
    Calls Claude to produce a list of task steps, then converts to React Flow DAG.
    Returns list of task dicts (raw from Claude).
    """
    tools = MODULE_TOOLS.get(module.lower(), ["slack"])
    module_desc = MODULE_DESCRIPTIONS.get(module.lower(), "General automation task.")

    system = SYSTEM_PROMPT.format(
        tools=", ".join(tools),
        module_desc=module_desc,
    )

    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    logger.info("Calling Claude planner", extra={"module": module, "input_preview": user_input[:80]})

    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        system=system,
        messages=[{"role": "user", "content": f"Module: {module}\nRequest: {user_input}"}],
    )

    raw = message.content[0].text.strip()

    # Strip any accidental markdown fences
    raw = re.sub(r"^```[a-z]*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)

    steps: list[dict] = json.loads(raw)
    logger.info("DAG planned", extra={"step_count": len(steps), "module": module})
    return steps


def steps_to_react_flow(steps: list[dict], session_id: str, module: str) -> dict:
    """
    Converts raw step list into React Flow compatible DAG dict.
    Positions nodes horizontally with spacing.
    """
    nodes = []
    edges = []

    for i, step in enumerate(steps):
        nodes.append({
            "id": step["id"],
            "type": "agentNode",
            "position": {"x": 200 * i + 40, "y": 120},
            "data": {
                "label": step["label"],
                "tool": step.get("tool", "none"),
                "status": "pending",
                "payload": step.get("params", {}),
            },
        })

        for dep in step.get("depends_on", []):
            edges.append({
                "id": f"e_{dep}_{step['id']}",
                "source": dep,
                "target": step["id"],
                "animated": True,
            })

    return {
        "nodes": nodes,
        "edges": edges,
        "session_id": session_id,
        "module": module,
    }
