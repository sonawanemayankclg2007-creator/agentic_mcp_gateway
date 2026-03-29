from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.services.executor import DAGExecutor
from app.services.approval import ApprovalService
from app.utils.logger import logger
import uuid
 
router = APIRouter()
executor = DAGExecutor()
approval_svc = ApprovalService()
 
_runs: dict = {}
 
class ExecuteRequest(BaseModel):
    workflow_id: str
    dry_run: bool = False
 
class ApprovalRequest(BaseModel):
    run_id: str
    task_id: str
    approved: bool
    comment: str = ""
 
@router.post("/run")
async def run_workflow(req: ExecuteRequest, background_tasks: BackgroundTasks):
    run_id = str(uuid.uuid4())
    _runs[run_id] = {"status": "queued", "logs": [], "results": {}}
    background_tasks.add_task(executor.execute, req.workflow_id, run_id, _runs, req.dry_run)
    logger.info(f"Execution queued: run_id={run_id}, workflow_id={req.workflow_id}")
    return {"run_id": run_id, "status": "queued"}
 
@router.get("/status/{run_id}")
def get_run_status(run_id: str):
    run = _runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"run_id": run_id, **run}
 
@router.get("/logs/{run_id}")
def get_logs(run_id: str):
    run = _runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"run_id": run_id, "logs": run.get("logs", [])}
 
@router.post("/approve")
async def approve_task(req: ApprovalRequest):
    result = await approval_svc.process(req.run_id, req.task_id, req.approved, req.comment)
    return result
 
@router.get("/pending-approvals")
def get_pending_approvals():
    return {"pending": approval_svc.get_pending()}