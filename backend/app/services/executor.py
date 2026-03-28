import asyncio
from datetime import datetime, timezone
from app.services import memory, approval as approval_svc
from app.mcp import gateway
from app.utils.logger import get_logger

logger = get_logger("executor")


def _topological_sort(steps: list[dict]) -> list[dict]:
    """
    Kahn's algorithm — returns steps in dependency order.
    Steps with no depends_on come first.
    """
    id_to_step = {s["id"]: s for s in steps}
    in_degree = {s["id"]: 0 for s in steps}
    dependents: dict[str, list[str]] = {s["id"]: [] for s in steps}

    for step in steps:
        for dep in step.get("depends_on", []):
            if dep in in_degree:
                in_degree[step["id"]] += 1
                dependents[dep].append(step["id"])

    queue = [sid for sid, deg in in_degree.items() if deg == 0]
    sorted_steps = []

    while queue:
        current = queue.pop(0)
        sorted_steps.append(id_to_step[current])
        for dependent in dependents[current]:
            in_degree[dependent] -= 1
            if in_degree[dependent] == 0:
                queue.append(dependent)

    # Fallback: append any remaining (cycles) in original order
    seen = {s["id"] for s in sorted_steps}
    for step in steps:
        if step["id"] not in seen:
            sorted_steps.append(step)

    return sorted_steps


def _make_event(step: str, tool: str, status: str, detail: str, node_id: str = "") -> dict:
    return {
        "type": f"step_{status}" if status in ("running", "done", "failed") else status,
        "node_id": node_id,
        "step": step,
        "tool": tool,
        "status": status,
        "detail": detail,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def run_dag(session_id: str, dag_steps: list[dict]) -> None:
    """
    Walks DAG in topological order.
    Emits SSE events to the session's asyncio.Queue.
    """
    queue: asyncio.Queue = memory.get_events_queue(session_id)
    sorted_steps = _topological_sort(dag_steps)
    completed: set[str] = set()
    failed: set[str] = set()

    # Update all nodes to pending in memory dag
    dag = memory.get(session_id, "dag")
    if dag:
        for node in dag.get("nodes", []):
            node["data"]["status"] = "pending"
        memory.store(session_id, "dag", dag)

    for step in sorted_steps:
        step_id = step["id"]
        label = step["label"]
        tool = step.get("tool", "none")
        action = step.get("action", "")
        params = step.get("params", {})
        requires_approval = step.get("requires_approval", False)

        # Skip if any dependency failed
        deps = step.get("depends_on", [])
        if any(d in failed for d in deps):
            logger.warning("Skipping step due to failed dependency", extra={"step_id": step_id})
            failed.add(step_id)
            await queue.put(_make_event(label, tool, "failed", "Skipped — dependency failed", step_id))
            _update_node_status(session_id, step_id, "failed")
            continue

        # Emit running
        await queue.put(_make_event(label, tool, "running", f"Executing {action} via {tool}", step_id))
        _update_node_status(session_id, step_id, "running")
        logger.info("Executing step", extra={"step_id": step_id, "action": action, "tool": tool})

        # Human approval gate
        if requires_approval:
            await queue.put(_make_event(
                label, tool, "running",
                "⏸ Awaiting human approval…", step_id,
            ))
            approved = await approval_svc.wait_for_approval(session_id, step_id)
            if not approved:
                failed.add(step_id)
                await queue.put(_make_event(label, tool, "failed", "Rejected by user or timed out", step_id))
                _update_node_status(session_id, step_id, "failed")
                continue

        # Execute tool
        try:
            result = await gateway.execute_tool(tool, action, params)
            if result.get("success"):
                completed.add(step_id)
                detail = str(result.get("result", ""))[:200]
                await queue.put(_make_event(label, tool, "done", detail or "Completed", step_id))
                _update_node_status(session_id, step_id, "done")
                memory.get_session(session_id)["step_results"][step_id] = result
            else:
                raise RuntimeError(result.get("error", "Tool returned failure"))
        except Exception as exc:
            failed.add(step_id)
            logger.error("Step failed", extra={"step_id": step_id, "error": str(exc)})
            await queue.put(_make_event(label, tool, "failed", str(exc)[:200], step_id))
            _update_node_status(session_id, step_id, "failed")

    # Signal stream end
    await queue.put({"type": "done", "summary": f"{len(completed)} steps completed, {len(failed)} failed."})
    logger.info("DAG execution complete", extra={"session_id": session_id, "completed": len(completed), "failed": len(failed)})


def _update_node_status(session_id: str, node_id: str, status: str) -> None:
    dag = memory.get(session_id, "dag")
    if not dag:
        return
    for node in dag.get("nodes", []):
        if node["id"] == node_id:
            node["data"]["status"] = status
    memory.store(session_id, "dag", dag)
