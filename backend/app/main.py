from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import agent, workflow, execution
import uvicorn
 
app = FastAPI(
    title="PS6 — Agentic MCP Gateway",
    description="AI agent orchestrating third-party APIs via MCP",
    version="1.0.0"
)
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
app.include_router(agent.router, prefix="/api/agent", tags=["Agent"])
app.include_router(workflow.router, prefix="/api/workflow", tags=["Workflow"])
app.include_router(execution.router, prefix="/api/execution", tags=["Execution"])
 
@app.get("/")
def root():
    return {"status": "PS6 Agentic MCP Gateway is live", "version": "1.0.0"}
 
@app.get("/health")
def health():
    return {"status": "ok"}
 
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)