import asyncio
from typing import Dict, List
from app.utils.logger import logger
 
class ApprovalService:
    """Human-in-the-loop approval for sensitive tasks."""
 
    def __init__(self):
        self._pending: Dict[str, dict] = {}   # key: f"{run_id}:{task_id}"
        self._events: Dict[str, asyncio.Event] = {}
        self._decisions: Dict[str, bool] = {}
 
    async def request_approval(self, run_id: str, task_id: str, task: dict) -> bool:
        key = f"{run_id}:{task_id}"
        self._pending[key] = {
            "run_id": run_id,
            "task_id": task_id,
            "task_name": task.get("name"),
            "tool": task.get("tool"),
            "action": task.get("action"),
            "params": task.get("params", {}),
        }
        event = asyncio.Event()
        self._events[key] = event
        logger.info(f"Approval requested: {key}")
        
        try:
            await asyncio.wait_for(event.wait(), timeout=300)  # 5-min timeout
            return self._decisions.get(key, False)
        except asyncio.TimeoutError:
            logger.warning(f"Approval timed out for {key} — rejecting")
            return False
        finally:
            self._pending.pop(key, None)
            self._events.pop(key, None)
            self._decisions.pop(key, None)
 
    async def process(self, run_id: str, task_id: str, approved: bool, comment: str = "") -> dict:
        key = f"{run_id}:{task_id}"
        self._decisions[key] = approved
        event = self._events.get(key)
        if event:
            event.set()
            logger.info(f"Approval {'granted' if approved else 'rejected'} for {key}: {comment}")
            return {"message": f"Task {'approved' if approved else 'rejected'}", "key": key}
        return {"message": "No pending approval found", "key": key}
 
    def get_pending(self) -> List[dict]:
        return list(self._pending.values())