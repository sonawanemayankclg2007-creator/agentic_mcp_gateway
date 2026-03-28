import asyncio
from app.services import memory
from app.utils.logger import get_logger

logger = get_logger("approval")

TIMEOUT_SECONDS = 60
POLL_INTERVAL = 0.5


async def wait_for_approval(session_id: str, step_id: str) -> bool:
    """
    Marks step as awaiting approval, then polls memory every 0.5s.
    Returns True if approved, False if rejected or timed out (60s).
    """
    # Initialise pending state
    session = memory.get_session(session_id)
    session["approval_status"][step_id] = None

    logger.info(
        "Waiting for approval",
        extra={"session_id": session_id, "step_id": step_id},
    )

    elapsed = 0.0
    while elapsed < TIMEOUT_SECONDS:
        await asyncio.sleep(POLL_INTERVAL)
        elapsed += POLL_INTERVAL

        decision = session["approval_status"].get(step_id)
        if decision is True:
            logger.info("Approval granted", extra={"session_id": session_id, "step_id": step_id})
            return True
        if decision is False:
            logger.info("Approval rejected", extra={"session_id": session_id, "step_id": step_id})
            return False

    logger.warning(
        "Approval timed out — auto-rejecting",
        extra={"session_id": session_id, "step_id": step_id},
    )
    return False


def submit_approval(session_id: str, step_id: str, approved: bool) -> None:
    """Called by the /approval route to unblock a waiting step."""
    session = memory.get_session(session_id)
    session["approval_status"][step_id] = approved
    logger.info(
        "Approval submitted",
        extra={"session_id": session_id, "step_id": step_id, "approved": approved},
    )
