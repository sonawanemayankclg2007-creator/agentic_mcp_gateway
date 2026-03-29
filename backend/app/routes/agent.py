from fastapi import APIRouter
from app.services.ai_service import generate_workflow

router = APIRouter()

@router.post("/")
def run_agent(input: str):
    return generate_workflow(input)