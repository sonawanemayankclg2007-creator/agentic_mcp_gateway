from fastapi import APIRouter, HTTPException
from app.services import memory
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger("routes.workflow")


@router.get("/workflow/{session_id}")
async def get_workflow(session_id: str):
    dag = memory.get(session_id, "dag")
    if dag is None:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    logger.info("Workflow fetched", extra={"session_id": session_id})
    return dag
