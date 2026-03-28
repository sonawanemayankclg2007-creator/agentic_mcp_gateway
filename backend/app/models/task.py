from pydantic import BaseModel, Field
from enum import Enum


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


class Task(BaseModel):
    id: str
    label: str
    tool: str
    action: str
    params: dict = Field(default_factory=dict)
    depends_on: list[str] = Field(default_factory=list)
    requires_approval: bool = False
    status: TaskStatus = TaskStatus.PENDING
    result: dict = Field(default_factory=dict)
