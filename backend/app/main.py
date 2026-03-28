import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import agent, workflow, execution
from app.utils.logger import get_logger

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AVEOps backend started", extra={"version": "1.0.0"})
    yield
    logger.info("AVEOps backend shutting down")


app = FastAPI(
    title="AVEOps — Agentic MCP Gateway",
    description="AI-powered workflow orchestrator via MCP",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(agent.router, tags=["Agent"])
app.include_router(workflow.router, tags=["Workflow"])
app.include_router(execution.router, tags=["Execution"])


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    # Count how many tool tokens are actually configured
    tools_connected = sum([
        bool(os.getenv("GITHUB_TOKEN")),
        bool(os.getenv("JIRA_TOKEN")),
        bool(os.getenv("SLACK_BOT_TOKEN")),
        bool(os.getenv("GOOGLE_SHEETS_KEY")),
    ])
    return {"status": "ok", "tools_connected": tools_connected}
