from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.planner import generate_workflow
from app.services.memory import MemoryStore
from app.utils.logger import logger
 
router = APIRouter()
memory = MemoryStore()
 
class AgentRequest(BaseModel):
    user_input: str
    session_id: str = "default"
    context: dict = {}
 
class AgentResponse(BaseModel):
    session_id: str
    plan: dict
    message: str
 
@router.post("/chat", response_model=AgentResponse)
async def chat_with_agent(req: AgentRequest):
    """Accept natural language input and return an AI-generated workflow plan."""
    try:
        logger.info(f"Agent request | session={req.session_id} | input={req.user_input[:80]}")
        history = memory.get(req.session_id)
        plan = await generate_workflow(req.user_input, history, req.context)
        memory.append(req.session_id, {"role": "user", "content": req.user_input})
        memory.append(req.session_id, {"role": "assistant", "content": str(plan)})
        return AgentResponse(session_id=req.session_id, plan=plan, message="Workflow generated successfully")
    except Exception as e:
        logger.error(f"Agent error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
 
@router.get("/history/{session_id}")
def get_history(session_id: str):
    return {"session_id": session_id, "history": memory.get(session_id)}
 
@router.delete("/history/{session_id}")
def clear_history(session_id: str):
    memory.clear(session_id)
    return {"message": f"History cleared for session {session_id}"}