import axios from 'axios'

/** Dev: `/api` → Vite proxy to FastAPI. Prod: set `VITE_API_BASE_URL` to backend origin (no trailing `/api`). */
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
})

const MODULE_TO_BACKEND = {
  DevOps: 'devops',
  FinOps: 'finops',
  Pricing: 'pricing',
  Talent: 'talent',
  'Supply Chain': 'supply_chain',
  GeoSpatial: 'geospatial',
}

export function toBackendModule(displayName) {
  const m = MODULE_TO_BACKEND[displayName]
  if (!m) throw new Error(`Unknown module: ${displayName}`)
  return m
}

// ─── Agent ────────────────────────────────────────────────────────────────────

/**
 * Start agent run against FastAPI.
 * `module` is the UI display name (e.g. "DevOps"); it is mapped to backend keys (e.g. devops).
 * Returns { workflowId, nodes, edges } in the shape the canvas already expects.
 */
export async function runAgent({ input, module }) {
  const backendModule = toBackendModule(module)
  try {
    const { data } = await client.post('/agent/run', { input, module: backendModule })
    return {
      workflowId: data.session_id,
      nodes: data.dag?.nodes ?? [],
      edges: data.dag?.edges ?? [],
    }
  } catch (err) {
    const msg = formatAxiosError(err)
    throw new Error(msg)
  }
}

/**
 * Fetch DAG JSON for a given workflow_id
 */
export async function getWorkflow(id) {
  const { data } = await client.get(`/workflow/${id}`)
  return data
}

/**
 * Send approve / reject decision for a paused step
 */
export async function sendApproval(sessionId, approved, stepId = '') {
  const { data } = await client.post(`/approval/${sessionId}`, { approved, step_id: stepId })
  return data
}

/**
 * Health check – returns { status, mcp_tools }
 */
export async function getHealth() {
  const { data } = await client.get('/health')
  return data
}

function formatAxiosError(err) {
  const d = err.response?.data
  if (typeof d?.detail === 'string') return d.detail
  if (Array.isArray(d?.detail)) return d.detail.map((x) => x.msg ?? JSON.stringify(x)).join(', ')
  return err.message || 'Request failed'
}

/** Map FastAPI executor SSE payloads to the same event types ChatBox already handles. */
function normalizeExecutionEvent(raw) {
  if (!raw || typeof raw !== 'object') return null
  const { type, node_id: nodeId, step, detail } = raw
  if (type === 'step_running') {
    return { type: 'step_start', node_id: nodeId, step, status: 'running', detail }
  }
  if (type === 'step_done') {
    return { type: 'step_done', node_id: nodeId, step, status: 'done', detail }
  }
  if (type === 'step_failed') {
    return { type: 'step_failed', node_id: nodeId, step, status: 'failed', detail }
  }
  if (type === 'done') {
    return raw
  }
  return null
}

async function* readSseJsonEvents(responseBody) {
  const reader = responseBody.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let sep
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      for (const line of block.split('\n')) {
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trimStart()
        if (!payload) continue
        try {
          yield JSON.parse(payload)
        } catch {
          /* ignore malformed chunk */
        }
      }
    }
  }
}

/**
 * Live execution stream (GET /execution/stream/{sessionId}).
 * Yields the same shapes as mockStreamExecution so the UI needs no redesign.
 */
export async function* streamExecution(workflowId, nodes, options = {}) {
  const { module = 'DevOps', inputText = '' } = options
  const url = `${API_BASE}/execution/stream/${workflowId}`
  let res
  try {
    res = await fetch(url)
  } catch (e) {
    throw new Error(e.message || 'Failed to open execution stream')
  }
  if (!res.ok) {
    let detail = res.statusText
    try {
      const j = await res.json()
      if (typeof j?.detail === 'string') detail = j.detail
    } catch {
      /* use statusText */
    }
    throw new Error(detail || `Stream failed (${res.status})`)
  }
  if (!res.body) throw new Error('No response body')

  for await (const raw of readSseJsonEvents(res.body)) {
    const ev = normalizeExecutionEvent(raw)
    if (!ev) continue
    if (ev.type === 'done' && !ev.output) {
      yield {
        ...ev,
        output: mockBuildWorkflowOutput(module, inputText, nodes),
      }
    } else {
      yield ev
    }
  }
}

// ─── Mock helpers (offline / tests) ───────────────────────────────────────────

const MOCK_DELAY = (ms) => new Promise((r) => setTimeout(r, ms))

export async function mockRunAgent({ input, module }) {
  await MOCK_DELAY(600)
  const workflowId = `wf_${Date.now()}`

  const steps = {
    DevOps: [
      { id: 'n1', label: 'Read GitHub Issue', tool: 'github' },
      { id: 'n2', label: 'Classify Severity', tool: 'claude' },
      { id: 'n3', label: 'Label Issue', tool: 'github' },
      { id: 'n4', label: 'Create Jira Ticket', tool: 'jira' },
      { id: 'n5', label: 'Notify Slack', tool: 'slack' },
    ],
    FinOps: [
      { id: 'n1', label: 'Load Cost Data', tool: 'sheets' },
      { id: 'n2', label: 'Detect Anomalies', tool: 'claude' },
      { id: 'n3', label: 'Forecast 7 days', tool: 'claude' },
      { id: 'n4', label: 'Create Jira Task', tool: 'jira' },
      { id: 'n5', label: 'Post to #finops', tool: 'slack' },
    ],
    Talent: [
      { id: 'n1', label: 'Parse Job Description', tool: 'claude' },
      { id: 'n2', label: 'Search GitHub Profiles', tool: 'github' },
      { id: 'n3', label: 'Score Candidates', tool: 'claude' },
      { id: 'n4', label: 'Post Shortlist', tool: 'slack' },
    ],
    Pricing: [
      { id: 'n1', label: 'Read Competitor Prices', tool: 'sheets' },
      { id: 'n2', label: 'Detect Price Drops', tool: 'claude' },
      { id: 'n3', label: 'Calculate Optimal Price', tool: 'claude' },
      { id: 'n4', label: 'Append to Sheets', tool: 'sheets' },
      { id: 'n5', label: 'Alert #pricing', tool: 'slack' },
    ],
    'Supply Chain': [
      { id: 'n1', label: 'Load Demand Data', tool: 'sheets' },
      { id: 'n2', label: 'Generate Forecast', tool: 'claude' },
      { id: 'n3', label: 'Run Risk Scenarios', tool: 'claude' },
      { id: 'n4', label: 'Post Summary', tool: 'slack' },
    ],
    GeoSpatial: [
      { id: 'n1', label: 'Fetch Location Data', tool: 'maps' },
      { id: 'n2', label: 'Analyse Amenities', tool: 'claude' },
      { id: 'n3', label: 'Score Site', tool: 'claude' },
      { id: 'n4', label: 'Export to Sheets', tool: 'sheets' },
    ],
  }

  const nodes = (steps[module] || steps['DevOps']).map((s, i) => ({
    id: s.id,
    type: 'agentNode',
    position: { x: 180 * i + 40, y: 120 },
    data: { label: s.label, tool: s.tool, status: 'pending' },
  }))

  const edges = nodes.slice(0, -1).map((n, i) => ({
    id: `e${i}`,
    source: n.id,
    target: nodes[i + 1].id,
    animated: true,
  }))

  return { workflowId, nodes, edges }
}

/**
 * Rich mock payload for module-specific output UI (docked on terminal DAG node).
 * @param {string} module
 * @param {string} inputText
 * @param {{ id: string, data: { label: string, tool: string } }[]} nodes
 */
export function mockBuildWorkflowOutput(module, inputText, nodes) {
  const lastLabel = nodes[nodes.length - 1]?.data?.label ?? 'Complete'
  const tail = inputText.trim().slice(0, 120) || '—'

  const sev = ['P3 · Maintenance', 'P2 · High', 'P1 · Critical'][Math.floor(Math.random() * 3)]
  const jira = `AVE-${1000 + Math.floor(Math.random() * 8999)}`
  const slack = ['#eng-triage', '#sre-alerts', '#platform', '#incidents'][Math.floor(Math.random() * 4)]

  if (module === 'DevOps') {
    return {
      variant: 'devops',
      accent: '#8b5cf6',
      title: 'Shipped to Slack & Jira',
      terminalStep: lastLabel,
      summary: 'Issue labelled, ticket created, channel notified.',
      issueHint: tail,
      severity: sev,
      jiraKey: jira,
      slackChannel: slack,
      prLabels: ['triage/ok', 'area/backend', 'customer-impact'],
    }
  }

  if (module === 'FinOps') {
    const delta = (8 + Math.random() * 28).toFixed(1)
    const forecast = (120 + Math.random() * 40).toFixed(0)
    return {
      variant: 'finops',
      accent: '#38bdf8',
      title: 'Cost intelligence snapshot',
      terminalStep: lastLabel,
      summary: 'Anomaly scoped; forecast refreshed for finance.',
      deltaPct: delta,
      forecastK: forecast,
      region: 'us-east-1',
      topService: /RDS|EC2|EKS|S3/i.exec(inputText)?.[0] || 'EC2',
      anomalyNote: tail.slice(0, 90),
    }
  }

  if (module === 'Pricing') {
    const sku = tail.split(/\s+/)[0] || 'SKU'
    return {
      variant: 'pricing',
      accent: '#fbbf24',
      title: 'Pricing recommendation',
      terminalStep: lastLabel,
      summary: 'Elasticity model run; competitor window applied.',
      sku,
      recommended: (49 + Math.random() * 40).toFixed(2),
      currency: 'USD',
      competitorMoves: Math.floor(2 + Math.random() * 5),
      guardrail: 'Floor: MAP policy Q2',
    }
  }

  if (module === 'Talent') {
    return {
      variant: 'talent',
      accent: '#f472b6',
      title: 'Shortlist ready',
      terminalStep: lastLabel,
      summary: 'Ranked candidates posted to Slack for review.',
      role: tail.slice(0, 72) || 'Open role',
      shortlisted: Math.floor(3 + Math.random() * 5),
      topMatch: `${78 + Math.floor(Math.random() * 18)}%`,
      highlights: ['TypeScript', 'system design', 'EU time zone'],
    }
  }

  if (module === 'Supply Chain') {
    return {
      variant: 'supply',
      accent: '#34d399',
      title: 'Scenario pack',
      terminalStep: lastLabel,
      summary: 'Demand shock + supplier slip modelled.',
      risk: ['Low', 'Medium', 'Elevated'][Math.floor(Math.random() * 3)],
      scenariosRun: 4,
      coverPct: `${84 + Math.floor(Math.random() * 12)}%`,
      note: tail.slice(0, 88),
    }
  }

  if (module === 'GeoSpatial') {
    return {
      variant: 'geo',
      accent: '#f87171',
      title: 'Site suitability',
      terminalStep: lastLabel,
      summary: 'Amenities + footfall blended score.',
      address: tail,
      score: `${72 + Math.floor(Math.random() * 22)} / 100`,
      tier: ['B+', 'A-', 'A'][Math.floor(Math.random() * 3)],
      flags: ['Transit 8m', 'Competition moderate'],
    }
  }

  return {
    variant: 'devops',
    accent: '#8b5cf6',
    title: 'Shipped to Slack & Jira',
    terminalStep: lastLabel,
    summary: 'Issue labelled, ticket created, channel notified.',
    issueHint: tail,
    severity: sev,
    jiraKey: jira,
    slackChannel: slack,
    prLabels: ['triage/ok', 'area/backend', 'customer-impact'],
  }
}

export async function* mockStreamExecution(nodes, options = {}) {
  const { module = 'DevOps', inputText = '' } = options
  const toolDetails = {
    github: 'Calling GitHub REST API',
    jira: 'Calling Jira Cloud API',
    slack: 'Sending Slack Bot message',
    claude: 'Claude reasoning over context',
    sheets: 'Accessing Google Sheets',
    maps: 'Fetching Google Maps data',
  }

  for (const node of nodes) {
    await MOCK_DELAY(400)
    yield { type: 'step_start', node_id: node.id, step: node.data.label, status: 'running', detail: toolDetails[node.data.tool] || '' }
    await MOCK_DELAY(900 + Math.random() * 600)
    yield { type: 'step_done', node_id: node.id, step: node.data.label, status: 'done', detail: 'Completed successfully' }
  }

  yield {
    type: 'done',
    summary: 'All steps completed. Results dispatched.',
    output: mockBuildWorkflowOutput(module, inputText, nodes),
  }
}
