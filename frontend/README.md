# AVEOps — Agentic MCP Gateway Frontend

Dark purple + black React frontend for the AVEOps platform.

## Stack
- React 18 + Vite 5
- Tailwind CSS (dark purple/black theme)
- React Flow (live DAG visualisation)
- Axios + SSE (streaming)

## Setup

```bash
npm install
npm run dev
```

App runs at http://localhost:3000

## File structure

```
src/
├── App.jsx                  # Root + global context (agentState, approval)
├── main.jsx                 # ReactDOM entry
├── index.css                # Tailwind + React Flow overrides
│
├── pages/
│   └── Dashboard.jsx        # 3-column layout: sidebar / centre / right
│
├── components/
│   ├── ChatBox.jsx          # Input bar + module selector + Run button
│   ├── DAGView.jsx          # React Flow live node graph
│   ├── ExecutionLog.jsx     # SSE step log + tool status cards
│   └── ApprovalModal.jsx    # Human-in-the-loop approval gate (60s timeout)
│
└── services/
    └── api.js               # runAgent, getWorkflow, streamExecution, sendApproval
                             # + mock* helpers for dev without a backend
```

## Connecting to the backend

`api.js` proxies via `/api` → `http://localhost:8000` (configured in `vite.config.js`).

In `ChatBox.jsx` replace the `mockRunAgent` / `mockStreamExecution` calls with
the real `runAgent` + `streamExecution` calls once the FastAPI backend is running.

## Design tokens (tailwind.config.js)

| Token         | Hex       |
|---------------|-----------|
| bg            | #0D0D0D   |
| surface       | #1E1B2E   |
| accent        | #7C3AED   |
| accent-deep   | #4C1D95   |
| accent-light  | #A78BFA   |
| success       | #10B981   |
| warning       | #F59E0B   |
| error         | #EF4444   |
