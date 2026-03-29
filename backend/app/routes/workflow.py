from fastapi import APIRouter, HTTPException
from app.models.workflow import WorkflowDAG, WorkflowStatus
from app.storage import _workflows

router = APIRouter()
@router.get("/list")
def list_workflows():
    return {"workflows": [w.dict() for w in _workflows.values()]}
 
@router.get("/{workflow_id}")
def get_workflow(workflow_id: str):
    wf = _workflows.get(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf.dict()
 
@router.delete("/{workflow_id}")
def delete_workflow(workflow_id: str):
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    del _workflows[workflow_id]
    return {"message": "Workflow deleted"}
 
@router.put("/{workflow_id}/approve")
def approve_workflow(workflow_id: str):
    wf = _workflows.get(workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    wf.status = WorkflowStatus.APPROVED
    return {"message": "Workflow approved", "workflow_id": workflow_id}
