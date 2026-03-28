import json
import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services import memory, approval as approval_svc
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger("routes.execution")

# How long to wait for the executor to start before giving up (seconds)
STREAM_TIMEOUT = 300


class ApprovalRequest(BaseModel):
    approved: bool
    step_id: str = ""   # optional — if omitted, applies to first pending step


@router.get("/execution/stream/{session_id}")
async def stream_execution(session_id: str):
    session = memory.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    queue: asyncio.Queue = memory.get_events_queue(session_id)

    async def event_generator():
        # Yield a comment to open the connection immediately
        yield ": connected\n\n"

        total_wait = 0.0
        while total_wait < STREAM_TIMEOUT:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=1.0)
                payload = json.dumps(event)
                yield f"data: {payload}\n\n"

                if event.get("type") == "done":
                    logger.info("SSE stream complete", extra={"session_id": session_id})
                    break
            except asyncio.TimeoutError:
                # Send keepalive comment so the connection doesn't drop
                yield ": keepalive\n\n"
                total_wait += 1.0

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/approval/{session_id}")
async def submit_approval(session_id: str, body: ApprovalRequest):
    session = memory.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    # If step_id provided use it; otherwise find the first pending approval
    step_id = body.step_id
    if not step_id:
        approval_status: dict = session.get("approval_status", {})
        pending = [sid for sid, val in approval_status.items() if val is None]
        if not pending:
            raise HTTPException(status_code=400, detail="No pending approvals for this session")
        step_id = pending[0]

    approval_svc.submit_approval(session_id, step_id, body.approved)
    logger.info(
        "Approval submitted via API",
        extra={"session_id": session_id, "step_id": step_id, "approved": body.approved},
    )
    return {"session_id": session_id, "step_id": step_id, "approved": body.approved}
