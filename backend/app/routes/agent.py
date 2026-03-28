import uuid
import asyncio
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.services import planner, executor, memory
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger("routes.agent")

VALID_MODULES = {"devops", "finops", "pricing", "talent", "supply_chain", "geospatial"}


class AgentRunRequest(BaseModel):
    input: str
    module: str


@router.post("/agent/run")
async def run_agent(body: AgentRunRequest, background_tasks: BackgroundTasks):
    module = body.module.lower().replace(" ", "_")
    if module not in VALID_MODULES:
        raise HTTPException(status_code=400, detail=f"Invalid module '{body.module}'. Must be one of: {', '.join(VALID_MODULES)}")

    session_id = str(uuid.uuid4())
    logger.info("Agent run started", extra={"session_id": session_id, "module": module})

    # Call Claude planner to get raw steps
    try:
        steps = await planner.generate_dag(body.input, module)
    except Exception as exc:
        logger.error("Planner failed", extra={"error": str(exc)})
        raise HTTPException(status_code=500, detail=f"Planner error: {str(exc)}")

    # Convert to React Flow DAG and store
    dag = planner.steps_to_react_flow(steps, session_id, module)
    memory.store(session_id, "dag", dag)
    memory.store(session_id, "raw_steps", steps)
    memory.store(session_id, "module", module)
    memory.store(session_id, "input", body.input)

    # Run executor as background task
    background_tasks.add_task(executor.run_dag, session_id, steps)

    logger.info("DAG stored, executor queued", extra={"session_id": session_id, "steps": len(steps)})
    return {"session_id": session_id, "dag": dag}
