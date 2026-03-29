from pydantic import BaseModel
from typing import Optional, Any
from enum import Enum
 
class TaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    REJECTED = "rejected"
    SKIPPED = "skipped"
    DRY_RUN = "dry_run"
 
class TaskResult(BaseModel):
    task_id: str
    status: TaskStatus
    output: Optional[Any] = None
    error: Optional[str] = None
    duration_ms: Optional[int] = None