import asyncio
from typing import Dict, Any
from app.mcp.gateway import MCPGateway
from app.services.approval import ApprovalService
from app.utils.logger import logger
from app.utils.retry import retry_async
 
gateway = MCPGateway()
approval_svc = ApprovalService()
 
class DAGExecutor:
    async def execute(self, workflow_id: str, run_id: str, runs: dict, dry_run: bool = False):
        """Execute a workflow DAG respecting dependencies and approval gates."""
        from app.routes.workflow import _workflows
        
        wf = _workflows.get(workflow_id)
        if not wf:
            runs[run_id]["status"] = "failed"
            runs[run_id]["logs"].append(f"ERROR: Workflow {workflow_id} not found")
            return
 
        runs[run_id]["status"] = "running"
        tasks = {t["id"]: t for t in wf.tasks}
        edges = wf.edges  # list of {from, to}
        
        # Build adjacency: task_id -> list of dependents
        deps: Dict[str, list] = {tid: [] for tid in tasks}
        in_degree: Dict[str, int] = {tid: 0 for tid in tasks}
        for edge in edges:
            deps[edge["from"]].append(edge["to"])
            in_degree[edge["to"]] += 1
 
        # Topological BFS
        queue = [tid for tid, deg in in_degree.items() if deg == 0]
        completed = set()
        results = {}
 
        while queue:
            # Run tasks with no remaining deps in parallel
            ready = list(queue)
            queue.clear()
            
            await asyncio.gather(*[
                self._run_task(tid, tasks[tid], run_id, runs, results, dry_run)
                for tid in ready
            ])
            
            for tid in ready:
                completed.add(tid)
                for dependent in deps[tid]:
                    in_degree[dependent] -= 1
                    if in_degree[dependent] == 0:
                        queue.append(dependent)
 
        runs[run_id]["status"] = "completed" if len(completed) == len(tasks) else "partial"
        runs[run_id]["results"] = results
        logger.info(f"Run {run_id} finished — status: {runs[run_id]['status']}")
 
    async def _run_task(self, task_id: str, task: dict, run_id: str, runs: dict, results: dict, dry_run: bool):
        log = runs[run_id]["logs"]
        log.append(f"[{task_id}] Starting: {task['name']}")
 
        # Human approval gate
        if task.get("requires_approval"):
            log.append(f"[{task_id}] Waiting for human approval...")
            approved = await approval_svc.request_approval(run_id, task_id, task)
            if not approved:
                log.append(f"[{task_id}] REJECTED by human")
                results[task_id] = {"status": "rejected"}
                return
 
        if dry_run:
            log.append(f"[{task_id}] DRY RUN — skipping actual execution")
            results[task_id] = {"status": "dry_run", "task": task}
            return
 
        try:
            result = await retry_async(
                gateway.call_tool,
                tool=task["tool"],
                action=task["action"],
                params=task.get("params", {}),
                max_retries=3
            )
            results[task_id] = {"status": "success", "output": result}
            log.append(f"[{task_id}] ✅ Done")
        except Exception as e:
            results[task_id] = {"status": "error", "error": str(e)}
            log.append(f"[{task_id}] ❌ Error: {e}")
 