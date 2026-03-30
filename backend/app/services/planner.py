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

HEAL_SYSTEM_PROMPT = """You are an auto-healing assistant for a software repo.

Given a bug report and optional repository context, propose a high-confidence fix.

Return ONLY a JSON object with this exact schema (no markdown, no code fences):
{
  "steps": [
    { "step": "string", "status": "completed" }
  ],
  "fix": "string",
  "pr_url": "string | null"
}

Rules:
- steps must be 3 to 6 items; status must always be "completed" (UI uses it as progress chips).
- fix should be actionable: include file paths, code snippets, and why the change works.
- If repo info is missing, do not fabricate PR URLs; set pr_url to null.
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


async def generate_heal(user_input: str, repo: str | None = None, file_path: str | None = None) -> dict:
    """
    Calls Claude to propose an auto-heal plan and a concrete fix.
    Returns dict: { steps: [{step,status}], fix: str, pr_url: str | None }
    """
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    ctx = {
        "bug": user_input,
        "repo": (repo or "").strip(),
        "file_path": (file_path or "").strip(),
    }

    logger.info("Calling Claude healer", extra={"repo": ctx["repo"] or None, "file_path": ctx["file_path"] or None})

    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1800,
        system=HEAL_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    "Bug report:\n"
                    f"{ctx['bug']}\n\n"
                    "Optional context:\n"
                    f"- repo: {ctx['repo'] or '(none)'}\n"
                    f"- file_path: {ctx['file_path'] or '(none)'}\n"
                ),
            }
        ],
    )

    raw = message.content[0].text.strip()
    raw = re.sub(r"^```[a-z]*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)

    payload: dict = json.loads(raw)
    steps = payload.get("steps") or []
    fix = payload.get("fix") or ""
    pr_url = payload.get("pr_url")

    # Normalize/guard for UI expectations.
    if not isinstance(steps, list):
        steps = []
    norm_steps = []
    for s in steps[:6]:
        if not isinstance(s, dict):
            continue
        step_txt = str(s.get("step") or "").strip()
        if not step_txt:
            continue
        norm_steps.append({"step": step_txt, "status": "completed"})

    if len(norm_steps) < 3:
        norm_steps = [
            {"step": "Reproduce and isolate the failure mode", "status": "completed"},
            {"step": "Identify the likely root cause and affected files", "status": "completed"},
            {"step": "Draft a minimal, safe patch and validate behavior", "status": "completed"},
        ]

    if not isinstance(fix, str):
        fix = str(fix)
    fix = fix.strip()

    if pr_url is not None and not isinstance(pr_url, str):
        pr_url = None
    pr_url = (pr_url.strip() if isinstance(pr_url, str) and pr_url.strip() else None)

    return {"steps": norm_steps, "fix": fix, "pr_url": pr_url}


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
