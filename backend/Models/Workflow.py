from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
 
class WorkflowStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"
 
class TaskNode(BaseModel):
    id: str
    name: str
    tool: str
    action: str
    params: dict = {}
    requires_approval: bool = False
    timeout_seconds: int = 30
 
class Edge(BaseModel):
    from_: str
    to: str
 
    class Config:
        fields = {"from_": "from"}
 
class WorkflowDAG(BaseModel):
    id: str
    name: str
    description: str
    tasks: List[dict]
    edges: List[dict]
    status: WorkflowStatus = WorkflowStatus.PENDING
    created_by: Optional[str] = None
    metadata: dict = {}