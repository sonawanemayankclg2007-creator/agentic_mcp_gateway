# AVEOps — Backend

FastAPI + Anthropic SDK backend for the AVEOps Agentic MCP Gateway.

## Setup

```bash
cd backend

# 1. Create virtualenv
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env and fill in your keys
copy .env.example .env       # Windows
# cp .env.example .env       # Mac/Linux

# 4. Start the server
uvicorn app.main:app --reload --port 8000
```

Server runs at http://localhost:8000
Interactive docs at http://localhost:8000/docs

---

## File Structure

```
backend/
├── app/
│   ├── main.py                   FastAPI entry, CORS, routers, /health
│   ├── routes/
│   │   ├── agent.py              POST /agent/run
│   │   ├── workflow.py           GET  /workflow/{session_id}
│   │   └── execution.py         GET  /execution/stream/{session_id}  (SSE)
│   │                             POST /approval/{session_id}
│   ├── services/
│   │   ├── planner.py            Claude → JSON DAG → React Flow format
│   │   ├── executor.py           Topological walk + SSE event emitter
│   │   ├── memory.py             In-memory session store (dict)
│   │   └── approval.py           Human-in-loop gate with 60s timeout
│   ├── mcp/
│   │   ├── gateway.py            Routes tool/action → correct module
│   │   └── tools/
│   │       ├── github.py         read_issue, add_label, post_comment
│   │       ├── jira.py           create_ticket, set_priority, link_issue
│   │       ├── slack.py          post_message, tag_user, get_channel_id
│   │       └── sheets.py         read_range, append_row
│   ├── models/
│   │   ├── workflow.py           DAG, Node, Edge, NodeData  (Pydantic)
│   │   └── task.py               Task, TaskStatus           (Pydantic)
│   └── utils/
│       ├── logger.py             JSON structured logger
│       └── retry.py              Async exponential-backoff decorator
├── requirements.txt
└── .env.example
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /agent/run | Start agent run — returns session_id + DAG |
| GET | /workflow/{id} | Get full DAG JSON for React Flow |
| GET | /execution/stream/{id} | SSE stream of step events |
| POST | /approval/{id} | Submit approve/reject for a paused step |
| GET | /health | Status + connected tool count |

---

## Switching frontend from mock to real

In `src/components/ChatBox.jsx`, change:
```js
const USE_MOCK = true   // ← change to false
```

Make sure backend is running at `http://localhost:8000` and your `.env` keys are set.

---

## Required .env keys

| Key | Where to get it |
|-----|----------------|
| ANTHROPIC_API_KEY | console.anthropic.com |
| GITHUB_TOKEN | github.com → Settings → Developer Settings → PAT |
| JIRA_URL | https://yourname.atlassian.net |
| JIRA_EMAIL | Your Atlassian account email |
| JIRA_TOKEN | id.atlassian.com → Security → API tokens |
| SLACK_BOT_TOKEN | api.slack.com/apps → Bot Token (xoxb-…) |
| GOOGLE_SHEETS_KEY | console.cloud.google.com → Sheets API key |
