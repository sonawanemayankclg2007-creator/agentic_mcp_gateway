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

export async function submitApproval(sessionId, approved, stepId = '') {
  return sendApproval(sessionId, approved, stepId)
}

/**
 * Health check – returns { status, mcp_tools }
 */
export async function getHealth() {
  const { data } = await client.get('/health')
  return data
}

// ─── Auto-heal ────────────────────────────────────────────────────────────────

export async function healBug({ input, repo = '', filePath = '' }) {
  try {
    const { data } = await client.post('/agent/heal', {
      input,
      repo: repo || null,
      file_path: filePath || null,
    })
    return data
  } catch (err) {
    const msg = formatAxiosError(err)
    throw new Error(msg)
  }
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
  if (type === 'thinking') {
    return { type: 'thinking', text: raw.text ?? '' }
  }
  if (type === 'approval_required') {
    return {
      type: 'approval_required',
      action: raw.action ?? '',
      tool: raw.tool ?? '',
      description: raw.description ?? '',
      outcome: raw.outcome ?? '',
      sessionId: raw.session_id ?? raw.sessionId ?? '',
      stepId: raw.step_id ?? raw.stepId ?? '',
    }
  }
  if (type === 'tool_done') {
    return {
      type: 'tool_done',
      tool: raw.tool ?? '',
      status: raw.status ?? (raw.error ? 'failed' : 'done'),
      result: raw.result ?? raw.detail ?? '',
      error: raw.error ?? '',
    }
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
    const currentPrice = Number((52 + Math.random() * 36).toFixed(2))
    const competitorDrop = Number((6 + Math.random() * 12).toFixed(1))
    const demandLift = Number((8 + Math.random() * 22).toFixed(1))
    const inventoryUnits = Math.floor(18 + Math.random() * 62)
    const recommendedPrice = Number((currentPrice * (0.96 + Math.random() * 0.06)).toFixed(2))
    const confidence = Math.floor(74 + Math.random() * 21)
    const conversionDelta = Number((2.5 + Math.random() * 7.5).toFixed(1))
    const revenueDelta = Number((1.2 + Math.random() * 6.4).toFixed(1))
    const riskLevel = inventoryUnits < 28 ? 'high' : demandLift > 20 ? 'medium' : 'low'
    const riskReason =
      riskLevel === 'high'
        ? 'Low inventory could cause stockouts if conversion spikes.'
        : riskLevel === 'medium'
          ? 'Aggressive market movement may trigger quick competitor response.'
          : 'Signal spread is stable with manageable downside.'
    return {
      variant: 'pricing',
      accent: '#fbbf24',
      title: 'Pricing recommendation',
      terminalStep: lastLabel,
      summary: 'Elasticity model run; competitor, demand, and inventory window applied.',
      sku,
      recommended: String(recommendedPrice.toFixed(2)),
      currency: 'USD',
      competitorMoves: Math.floor(2 + Math.random() * 5),
      guardrail: 'Floor: MAP policy Q2',
      pricingDecision: {
        recommended_price: recommendedPrice,
        confidence_score: confidence,
        current_price: currentPrice,
        expected_impact: {
          conversion_change_percent: conversionDelta,
          revenue_change_percent: revenueDelta,
        },
        signals: [
          `Competitor price dropped ${competitorDrop}% across top 3 rivals`,
          `Demand increased ${demandLift}% in the last 24 hours`,
          `Inventory currently at ${inventoryUnits} units`,
        ],
        reasoning: 'Price improves competitiveness while preserving margin under current demand pressure.',
        risk_level: riskLevel,
        risk_reason: riskReason,
        validity: {
          generated_at: new Date().toISOString(),
          valid_for: '1 hour',
        },
        actions: ['Apply Price', 'View Simulation', 'Recalculate'],
      },
    }
  }

  if (module === 'Talent') {
    const skillPool = ['TypeScript', 'React', 'Node.js', 'System Design', 'PostgreSQL', 'AWS', 'Docker']
    const topSkills = skillPool.sort(() => 0.5 - Math.random()).slice(0, 3)
    const candidates = [
      {
        name: 'Aarav Mehta',
        match: 86,
        conf: 83,
        loc: 'Bengaluru (IST)',
        skills: ['TypeScript', 'Node.js', 'System Design'],
        strengths: ['Led backend migration for 20+ services', 'Consistent weekly GitHub activity', 'Strong API design'],
        gaps: ['Limited AWS EKS production experience'],
        exp: '7 years building SaaS backends and internal platforms; scaled event-driven services.',
        repos: 39,
        stars: 228,
        projects: ['task-orchestrator: Queue-driven workflow engine'],
        reason: 'Strong architecture depth and relevant backend scaling outcomes.',
        risk: 'medium',
        link: 'https://github.com/aaravmehta',
      },
      {
        name: 'Maya Thompson',
        match: 79,
        conf: 76,
        loc: 'London (GMT)',
        skills: ['React', 'TypeScript', 'PostgreSQL'],
        strengths: ['Strong full-stack delivery speed', 'High quality code review history', 'Good cross-team collaboration'],
        gaps: ['Less distributed systems design exposure'],
        exp: '6 years in product engineering; shipped customer-facing analytics features.',
        repos: 28,
        stars: 141,
        projects: ['fin-insight-ui: React analytics dashboard'],
        reason: 'Balanced frontend-backend profile with strong execution track record.',
        risk: 'medium',
        link: 'https://github.com/mayathompson',
      },
      {
        name: 'Diego Alvarez',
        match: 91,
        conf: 88,
        loc: 'Madrid (CET)',
        skills: ['Node.js', 'AWS', 'System Design'],
        strengths: ['Designed resilient microservices', 'Strong observability practices', 'High-impact incident response history'],
        gaps: ['Smaller React surface area recently'],
        exp: '8 years building cloud-native services; owned reliability roadmap for B2B platform.',
        repos: 44,
        stars: 312,
        projects: ['service-mesh-toolkit: Reliability automation utilities'],
        reason: 'Excellent fit for backend-heavy role with proven cloud reliability impact.',
        risk: 'low',
        link: 'https://github.com/dalvarez',
      },
      {
        name: 'Nora Chen',
        match: 74,
        conf: 71,
        loc: 'Singapore (SGT)',
        skills: ['React', 'Docker', 'TypeScript'],
        strengths: ['Fast feature delivery', 'Clean component architecture', 'Good testing discipline'],
        gaps: ['Limited large-scale system design ownership'],
        exp: '5 years in startup environments; built product flows from MVP to growth stage.',
        repos: 22,
        stars: 96,
        projects: ['pipeline-viewer: Workflow visualization toolkit'],
        reason: 'Good delivery candidate with potential, but architecture depth still growing.',
        risk: 'high',
        link: 'https://github.com/norachen-dev',
      },
    ]

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
      talentDecision: {
        summary: {
          total_candidates_evaluated: 27,
          shortlisted_count: 4,
          top_match_score: 91,
          key_skills_detected: topSkills,
        },
        shortlisted_candidates: candidates.map((c) => ({
          name: c.name,
          match_score: c.match,
          confidence_score: c.conf,
          location: c.loc,
          primary_skills: c.skills,
          strengths: c.strengths,
          gaps: c.gaps,
          experience_summary: c.exp,
          github: {
            repos: c.repos,
            stars: c.stars,
            notable_projects: c.projects,
          },
          reason_for_selection: c.reason,
          risk_level: c.risk,
          profile_link: c.link,
        })),
        insights: {
          common_strengths: [
            'Strong TypeScript ecosystem experience across shortlisted candidates',
            'Good engineering hygiene with consistent GitHub activity',
          ],
          common_gaps: [
            'Cloud platform depth varies (especially Kubernetes/EKS)',
            'Not all candidates have owned large distributed architectures',
          ],
        },
        recommended_actions: [
          'Invite top 3 candidates to technical interview loop',
          'Review notable GitHub projects for architecture depth validation',
          'Keep one backup candidate for timezone and cloud-stack flexibility',
        ],
      },
    }
  }

  if (module === 'Supply Chain') {
    const dailyForecast = Array.from({ length: 7 }, () => Math.floor(140 + Math.random() * 85))
    const totalDemand = dailyForecast.reduce((s, n) => s + n, 0)
    const coveragePercent = Math.floor(78 + Math.random() * 18)
    const stockoutRisk =
      coveragePercent < 86 ? 'high' : coveragePercent < 92 ? 'medium' : 'low'
    const overallRisk =
      stockoutRisk === 'high' ? 'high' : Math.random() > 0.5 ? 'medium' : 'low'
    const conf = Math.floor(74 + Math.random() * 20)
    const scenarioA = {
      name: 'Supplier Delay (Tier-1)',
      impact: 'Inbound lead time increases by 3 days',
      risk_level: 'high',
      expected_issue: 'Fast-moving SKUs hit low safety stock by day 5',
      recommended_action: 'Expedite top 20% SKUs and reallocate from secondary warehouse',
      estimated_loss_if_ignored: `$${(42000 + Math.random() * 38000).toFixed(0)}`,
    }
    const scenarioB = {
      name: 'Demand Spike (Promo Lift)',
      impact: 'Demand rises ~18% above baseline for 72 hours',
      risk_level: 'medium',
      expected_issue: 'Pick-pack bottleneck and partial fulfillment delays',
      recommended_action: 'Pre-build wave picks and extend labor on high-volume lanes',
      estimated_loss_if_ignored: `$${(21000 + Math.random() * 25000).toFixed(0)}`,
    }
    const scenarioC = {
      name: 'Port Congestion',
      impact: 'International containers delayed 48–72 hours',
      risk_level: 'medium',
      expected_issue: 'Coverage drops below policy for imported components',
      recommended_action: 'Pull forward domestic substitutes and rebalance reorder points',
      estimated_loss_if_ignored: `$${(16000 + Math.random() * 22000).toFixed(0)}`,
    }

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
      supplyDecision: {
        forecast: {
          total_demand: totalDemand,
          daily_forecast: dailyForecast,
          confidence_score: conf,
        },
        risk_summary: {
          overall_risk_level: overallRisk,
          stockout_risk: stockoutRisk,
          coverage_percent: coveragePercent,
        },
        scenarios: [scenarioA, scenarioB, scenarioC],
        insights: {
          key_driver: 'Supplier lead-time volatility on top-demand SKUs',
          inventory_status: coveragePercent >= 90 ? 'Sufficient' : 'Insufficient',
        },
        recommended_plan: {
          action: 'Prioritize replenishment for top-demand SKUs and rebalance safety stock today',
          expected_benefit: 'Reduces projected stockout exposure and improves service level in the next 7 days',
          confidence: Math.max(70, conf - 3),
        },
        validity: {
          generated_at: new Date().toISOString(),
          forecast_window: '7 days',
        },
      },
    }
  }

  if (module === 'GeoSpatial') {
    const rawScore = 72 + Math.floor(Math.random() * 22);
    const grade = rawScore > 90 ? 'A+' : rawScore > 85 ? 'A' : rawScore > 80 ? 'A-' : rawScore > 75 ? 'B+' : 'B';
    const conf = 80 + Math.floor(Math.random() * 15);
    const hasHighRisk = rawScore < 76;
    
    const geoDecision = {
      overall_score: rawScore,
      grade: grade,
      confidence_score: conf,
      factors: [
        {
          name: "Foot Traffic",
          score: Math.min(100, rawScore + Math.floor(Math.random() * 10 - 3)),
          insight: "Strong midday volume driven by nearby tech district."
        },
        {
          name: "Competition",
          score: Math.min(100, Math.floor(Math.random() * 20 + 70)),
          insight: "Moderate overlap with 2 direct competitors within 1 mile."
        },
        {
          name: "Demographics",
          score: Math.min(100, rawScore + Math.floor(Math.random() * 15 - 5)),
          insight: "Affluent core user base aligns with target persona."
        },
        {
          name: "Accessibility",
          score: 88 + Math.floor(Math.random() * 10),
          insight: "Located < 5 min walk from major transit hub."
        }
      ],
      insights: {
        strengths: [
          "High visibility on primary arterial road",
          "Favorable zoning for immediate build-out"
        ],
        weaknesses: [
          "Limited dedicated parking space",
          "Above average local property tax rate"
        ]
      },
      recommendation: {
        decision: hasHighRisk ? "Not Recommended" : "Recommended",
        reason: hasHighRisk ? "Low foot traffic and high initial build-out costs outweigh potential revenue." : "Immediate catchment area provides strong baseline revenue with manageable competitive pressure.",
        best_use_case: "Flagship Retail / Concept Store"
      },
      risk_level: hasHighRisk ? "high" : (rawScore < 82 ? "medium" : "low"),
      risk_reason: hasHighRisk ? "Proximity to dominant incumbent poses margin pressure." : "Stable market conditions with standard operational risks.",
      what_if: {
        scenario_1: "Impact on score: -8 pts if new mixed-use development delays open by 6mo.",
        scenario_2: "Impact on score: +12 pts if transit authority expands lines next year."
      },
      validity: {
        analyzed_at: new Date().toISOString()
      }
    };

    return {
      variant: 'geo',
      accent: '#f87171',
      title: 'Site Suitability Report',
      terminalStep: lastLabel,
      summary: 'Location intelligence output formatted as structured decision data.',
      address: tail,
      geoDecision: geoDecision
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
