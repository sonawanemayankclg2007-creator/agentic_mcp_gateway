from pydantic import BaseModel, Field
from typing import Optional


class NodeData(BaseModel):
    label: str
    tool: str
    status: str = "pending"
    payload: dict = Field(default_factory=dict)


class Node(BaseModel):
    id: str
    type: str = "agentNode"
    data: NodeData
    position: dict = Field(default_factory=lambda: {"x": 0, "y": 0})


class Edge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool = True


class DAG(BaseModel):
    nodes: list[Node]
    edges: list[Edge]
    session_id: str
    module: str
