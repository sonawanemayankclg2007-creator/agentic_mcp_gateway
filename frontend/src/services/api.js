import axios from 'axios'

const BASE = '/api'

const client = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ─── Agent ────────────────────────────────────────────────────────────────────

/**
 * Start agent run. Returns { workflow_id }
 */
export async function runAgent({ input, module }) {
  const { data } = await client.post('/agent/run', { input, module })
  return data
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
export async function sendApproval(id, approved) {
  const { data } = await client.post(`/approval/${id}`, { approved })
  return data
}

/**
 * Health check – returns { status, mcp_tools }
 */
export async function getHealth() {
  const { data } = await client.get('/health')
  return data
}

// ─── SSE Streaming ────────────────────────────────────────────────────────────

/**
 * Open an SSE stream for a workflow.
 *
 * onEvent(event) is called for each streamed step.
 * Returns a cleanup function that closes the stream.
 *
 * Event shape: { type, node_id, step, status, detail, tool, payload }
 */
export function streamExecution(workflowId, onEvent, onDone, onError) {
  const url = `${BASE}/execution/stream?workflow_id=${workflowId}`
  const es = new EventSource(url)

  es.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data)
      if (event.type === 'done') {
        onDone?.(event)
        es.close()
      } else {
        onEvent(event)
      }
    } catch (err) {
      console.error('SSE parse error', err)
    }
  }

  es.onerror = (err) => {
    onError?.(err)
    es.close()
  }

  return () => es.close()
}

// ─── Mock helpers (for dev without a backend) ─────────────────────────────────

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
