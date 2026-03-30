import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  GitBranch,
  DollarSign,
  MapPin,
  Sparkles,
  Package,
  Tag,
  Users,
  MessageSquare,
  Ticket,
  TrendingUp,
  MapPinned,
  AlertTriangle,
} from 'lucide-react'
import { AppContext } from '../App.jsx'

function Pill({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  )
}

export default function ModuleOutputCard({ output, zoom = 1 }) {
  const { setAgentState, showToast, prefillChat, setOrbitMode } = useContext(AppContext)
  const [showFinopsGraph, setShowFinopsGraph] = useState(false)
  const [pricingSimulationOpen, setPricingSimulationOpen] = useState(false)
  const [priceApplied, setPriceApplied] = useState(false)
  const [cardWidth, setCardWidth] = useState(520)
  const [cardHeight, setCardHeight] = useState(520)
  const resizeRef = useRef(null)

  useEffect(() => {
    if (output?.variant !== 'finops') setShowFinopsGraph(false)
  }, [output?.variant, output?.title, output?.terminalStep])

  useEffect(() => {
    if (output?.variant !== 'pricing') {
      setPricingSimulationOpen(false)
      setPriceApplied(false)
    }
  }, [output?.variant, output?.title, output?.terminalStep])

  useEffect(() => {
    const widthDefaults = {
      devops: 420,
      finops: 620,
      pricing: 560,
      talent: 620,
      supply: 640,
      geo: 580,
    }
    const heightDefaults = {
      devops: 430,
      finops: 530,
      pricing: 580,
      talent: 640,
      supply: 660,
      geo: 640,
    }
    setCardWidth(widthDefaults[output?.variant] || 520)
    setCardHeight(heightDefaults[output?.variant] || 520)
  }, [output?.variant, output?.title, output?.terminalStep])

  if (!output) return null

  const MIN_W = 340
  const MAX_W = 980
  const MIN_H = 300
  const MAX_H = 860
  const baseWidthByVariant = { devops: 420, finops: 620, pricing: 560, talent: 620, supply: 640, geo: 580 }
  const baseHeightByVariant = { devops: 420, finops: 520, pricing: 560, talent: 620, supply: 640, geo: 640 }
  const baseWidth = cardWidth || baseWidthByVariant[output.variant] || 420
  const baseHeight = cardHeight || baseHeightByVariant[output.variant] || 420
  const viewportScale = Math.min(2, Math.max(0.55, zoom || 1))

  const beginResize = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startW = baseWidth
    const startH = baseHeight
    resizeRef.current = { startX, startY, startW, startH }
    setOrbitMode?.(true) // Switch to 3d orbit mode during resize
    const onMove = (ev) => {
      if (!resizeRef.current) return
      const dx = (ev.clientX - resizeRef.current.startX) / viewportScale
      const dy = (ev.clientY - resizeRef.current.startY) / viewportScale
      setCardWidth(Math.max(MIN_W, Math.min(MAX_W, Math.round(resizeRef.current.startW + dx))))
      setCardHeight(Math.max(MIN_H, Math.min(MAX_H, Math.round(resizeRef.current.startH + dy))))
    }
    const onUp = () => {
      resizeRef.current = null
      setOrbitMode?.(false) // Revert to graph mode
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
  const cardCommonStyle = {
    width: `${baseWidth}px`,
    height: `${baseHeight}px`,
    minWidth: '320px',
    minHeight: '280px',
    maxWidth: 'min(calc(100vw - 2rem), 960px)',
    maxHeight: 'min(calc(100vh - 3rem), 820px)',
    overflow: 'hidden',
    zoom: viewportScale,
    position: 'relative',
  }

  const resizeGrip = (
    <button
      type="button"
      onMouseDown={beginResize}
      className="nodrag nopan absolute bottom-1 right-1 h-4 w-4 cursor-se-resize rounded-sm border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.08]"
      title="Drag to resize"
    />
  )

  const head = (
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted/90">Output</p>
        <p className="text-base font-bold text-text-primary leading-tight">{output.title}</p>
        <p className="text-[11px] text-text-muted mt-0.5 truncate" title={output.terminalStep}>
          After · {output.terminalStep}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-text-muted">Drag corner to resize</span>
      </div>
    </div>
  )

  const shell = 'nodrag nopan pointer-events-auto rounded-xl border backdrop-blur-xl shadow-panel text-left animate-fade-in p-3'

  if (output.variant === 'devops') {
    return (
      <div
        className={`${shell} border-violet-500/30 bg-[#0d0a14]/95 ring-1 ring-violet-500/15`}
        style={{ ...cardCommonStyle, boxShadow: `0 0 40px -12px ${output.accent}66` }}
      >
        {head}
        <div className="space-y-2.5 overflow-y-auto pr-1 h-[calc(100%-56px)]">
          <div
            className="rounded-lg border border-white/[0.06] bg-surface-2/80 p-3 text-[11px] leading-relaxed text-text-primary/95"
            style={{ borderLeftWidth: 3, borderLeftColor: output.accent }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-accent-light/90">
                <MessageSquare size={12} />
                <span className="font-mono font-semibold">{output.slackChannel}</span>
              </div>
              <Pill className="bg-amber-950/50 text-warning border border-warning/25">{output.severity}</Pill>
            </div>

            <p className="mt-2 text-text-muted text-[10px] uppercase tracking-wider">Message preview</p>
            <div className="mt-1 max-h-[76px] overflow-y-auto pr-1">
              <p className="font-mono text-[11px] text-text-primary/90 whitespace-pre-wrap break-words">
                {output.summary}
              </p>
            </div>

            <p className="mt-2 text-[10px] text-text-muted truncate" title={output.issueHint}>
              Ref · {output.issueHint}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Pill className="bg-violet-950/40 text-violet-200 border border-violet-400/25">
              <Ticket size={10} className="mr-1 inline" />
              {output.jiraKey}
            </Pill>
            <span className="text-[10px] text-success/90 flex items-center gap-1 ml-auto">
              <GitBranch size={11} />
              DevOps delivery
            </span>
          </div>

          {(output.prLabels || []).length > 0 && (
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Labels</p>
              <div className="flex flex-wrap gap-1 max-h-[52px] overflow-y-auto pr-1">
                {(output.prLabels || []).map((l) => (
                  <span
                    key={l}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/[0.05] text-text-muted font-mono whitespace-nowrap"
                    title={l}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        {resizeGrip}
      </div>
    )
  }

  if (output.variant === 'finops') {
    return (
      <div
        className={`${shell} border-sky-500/35 bg-[#060d14]/95 ring-1 ring-sky-500/15`}
        style={{ ...cardCommonStyle, boxShadow: `0 0 40px -12px ${output.accent}55` }}
      >
        {head}
        <div className="mb-2 overflow-y-auto pr-1 h-[calc(100%-56px)]">
          <button
            type="button"
            onClick={() => setShowFinopsGraph((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-950/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-200 hover:bg-sky-900/30 transition-colors"
          >
            {showFinopsGraph ? 'Show summary' : 'Turn output into graph'}
          </button>
        </div>

        {showFinopsGraph ? (
          <FinOpsChart output={output} />
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="rounded-lg bg-sky-950/35 border border-sky-500/20 p-2">
                <p className="text-[9px] uppercase text-sky-200/70 tracking-wide">Δ vs baseline</p>
                <p className="text-lg font-mono font-bold text-sky-200">+{output.deltaPct}%</p>
              </div>
              <div className="rounded-lg bg-surface-2/80 border border-white/[0.06] p-2">
                <p className="text-[9px] uppercase text-text-muted tracking-wide">Forecast 7d (k)</p>
                <p className="text-lg font-mono font-bold text-text-primary">${output.forecastK}k</p>
              </div>
            </div>
            <p className="text-[11px] text-text-muted mb-1 flex items-center gap-1">
              <TrendingUp size={12} className="text-sky-300" />
              Top driver · <span className="text-text-primary font-mono">{output.topService}</span> ·{' '}
              {output.region}
            </p>
            <p className="text-[10px] text-text-muted/90 leading-snug border-t border-white/[0.06] pt-2 mt-1">
              {output.anomalyNote}
            </p>
            <p className="mt-2 text-[10px] text-sky-300/90 flex items-center gap-1">
              <DollarSign size={11} />
              FinOps snapshot
            </p>
          </div>
        )}
        {resizeGrip}
      </div>
    )
  }

  if (output.variant === 'pricing') {
    const decision = output.pricingDecision || {
      recommended_price: Number(output.recommended || 0),
      confidence_score: 78,
      current_price: Number((Number(output.recommended || 0) * 1.04).toFixed(2)),
      expected_impact: {
        conversion_change_percent: 4.8,
        revenue_change_percent: 2.9,
      },
      signals: [
        `Competitor moves observed: ${output.competitorMoves ?? 0}`,
        'Demand trend positive in key segment',
        'Inventory within standard threshold',
      ],
      reasoning: 'Balanced price improves win-rate while protecting gross margin.',
      risk_level: 'medium',
      risk_reason: output.guardrail || 'Guardrail policy limits downside moves.',
      validity: {
        generated_at: new Date().toISOString(),
        valid_for: '1 hour',
      },
      actions: ['Apply Price', 'View Simulation', 'Recalculate'],
    }
    const riskTone =
      decision.risk_level === 'high'
        ? 'text-red-200 border-red-400/30 bg-red-950/35'
        : decision.risk_level === 'medium'
          ? 'text-amber-200 border-amber-400/30 bg-amber-950/30'
          : 'text-emerald-200 border-emerald-400/30 bg-emerald-950/30'

    const handlePricingAction = (action) => {
      if (action === 'Apply Price') {
        setPriceApplied(true)
        showToast?.(
          `Applied ${output.currency} ${Number(decision.recommended_price).toFixed(2)} for ${output.sku}`,
          'success'
        )
        return
      }
      if (action === 'View Simulation') {
        setPricingSimulationOpen((v) => !v)
        return
      }
      if (action === 'Recalculate') {
        const prompt = [
          `Recalculate pricing for ${output.sku}.`,
          `Current price: ${output.currency} ${Number(decision.current_price).toFixed(2)}.`,
          `Latest recommendation: ${output.currency} ${Number(decision.recommended_price).toFixed(2)}.`,
          `Signals: ${(decision.signals || []).join('; ')}.`,
          'Recompute with updated elasticity and competitor reaction.',
        ].join(' ')
        prefillChat?.(prompt, 'Pricing')
        showToast?.('Pricing recalculation prompt loaded in chat', 'default')
      }
    }

    const simulatedRevenueDelta = Number(decision.expected_impact?.revenue_change_percent ?? 0)
    const simulatedConvDelta = Number(decision.expected_impact?.conversion_change_percent ?? 0)
    const projectedUnitsIdx = Math.max(
      0,
      Math.round(100 * (1 + simulatedConvDelta / 100))
    )
    const projectedRevenueIdx = Math.max(
      0,
      Math.round(100 * (1 + simulatedRevenueDelta / 100))
    )
    return (
      <div
        className={`${shell} border-amber-400/35 bg-[#140f05]/95 ring-1 ring-amber-400/15`}
        style={{ ...cardCommonStyle, boxShadow: `0 0 40px -12px ${output.accent}44` }}
      >
        {head}
        <div className="overflow-y-auto pr-1 h-[calc(100%-56px)]">
          <div className="rounded-lg border border-amber-500/20 bg-amber-950/25 p-2.5 mb-2">
            <p className="text-[9px] uppercase tracking-wide text-amber-200/70">Recommended price</p>
            <p className="text-2xl font-mono font-bold text-amber-100">
              {output.currency} {Number(decision.recommended_price).toFixed(2)}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
              <span className="text-text-muted">Current {output.currency} {Number(decision.current_price).toFixed(2)}</span>
              <span className="text-amber-200/90">SKU {output.sku}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
            <div className="rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-1.5">
              <p className="uppercase text-text-muted">Confidence</p>
              <p className="font-mono text-text-primary">{decision.confidence_score}%</p>
            </div>
            <div className="rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-1.5">
              <p className="uppercase text-text-muted">Expected impact</p>
              <p className="font-mono text-text-primary">
                +{decision.expected_impact?.conversion_change_percent ?? 0}% conv
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-black/20 p-2">
            <p className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Signals</p>
            <ul className="space-y-1">
              {(decision.signals || []).slice(0, 4).map((s) => (
                <li key={s} className="text-[11px] text-text-primary/90 leading-snug">• {s}</li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-amber-100/95">{decision.reasoning}</p>
          </div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <Pill className={riskTone}>
              <AlertTriangle size={10} className="mr-1 inline" />
              Risk {decision.risk_level}
            </Pill>
            <span className="text-[10px] text-text-muted truncate" title={decision.risk_reason}>
              {decision.risk_reason}
            </span>
          </div>
          <div className="mt-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
            <p className="text-[10px] text-text-muted">
              Validity · <span className="font-mono">{decision.validity?.valid_for || '1 hour'}</span>
              {' '}· <span className="font-mono">{decision.validity?.generated_at || new Date().toISOString()}</span>
            </p>
          </div>
          <div className="mt-2 flex gap-1.5">
            {(decision.actions || []).slice(0, 3).map((a, idx) => (
              <button
                key={a}
                type="button"
                onClick={() => handlePricingAction(a)}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition-colors ${idx === 0
                    ? 'border-amber-400/35 bg-amber-500/15 text-amber-100 hover:bg-amber-500/22'
                    : 'border-white/[0.1] bg-white/[0.03] text-text-muted hover:text-text-primary'
                  }`}
                title={a}
              >
                {a}
              </button>
            ))}
          </div>
          {priceApplied && (
            <p className="mt-2 text-[10px] text-emerald-300/95">
              Price applied. Publish pipeline queued for downstream systems.
            </p>
          )}
          {pricingSimulationOpen && (
            <div className="mt-2 rounded-lg border border-white/[0.08] bg-black/25 p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Simulation</p>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
                  <p className="uppercase text-text-muted">Price idx</p>
                  <p className="font-mono text-amber-100">
                    {Math.round((Number(decision.recommended_price) / Math.max(1, Number(decision.current_price))) * 100)}
                  </p>
                </div>
                <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
                  <p className="uppercase text-text-muted">Units idx</p>
                  <p className="font-mono text-text-primary">{projectedUnitsIdx}</p>
                </div>
                <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
                  <p className="uppercase text-text-muted">Revenue idx</p>
                  <p className="font-mono text-text-primary">{projectedRevenueIdx}</p>
                </div>
              </div>
            </div>
          )}
          <p className="mt-2 text-[10px] text-amber-200/90 flex items-center gap-1">
            <Tag size={11} />
            Real-time pricing engine
          </p>
        </div>
        {resizeGrip}
      </div>
    )
  }

  if (output.variant === 'talent') {
    const td = output.talentDecision || {
      summary: {
        total_candidates_evaluated: 12,
        shortlisted_count: Number(output.shortlisted || 3),
        top_match_score: Number(String(output.topMatch || '80').replace('%', '')),
        key_skills_detected: output.highlights || ['TypeScript', 'system design', 'Node.js'],
      },
      shortlisted_candidates: [],
      insights: { common_strengths: [], common_gaps: [] },
      recommended_actions: ['Invite top candidates', 'Review portfolio projects', 'Finalize panel feedback'],
    }
    return (
      <div
        className={`${shell} border-fuchsia-400/30 bg-[#120812]/95 ring-1 ring-fuchsia-500/15`}
        style={{ ...cardCommonStyle, boxShadow: `0 0 40px -12px ${output.accent}55` }}
      >
        {head}
        <div className="overflow-y-auto pr-1 h-[calc(100%-56px)]">
          <p className="text-[11px] text-fuchsia-100/85 mb-2 leading-snug">{output.role}</p>
          <div className="grid grid-cols-3 gap-2 mb-2 text-[10px]">
            <div className="rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-1.5">
              <p className="uppercase text-text-muted">Evaluated</p>
              <p className="font-mono text-text-primary">{td.summary.total_candidates_evaluated}</p>
            </div>
            <div className="rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-1.5">
              <p className="uppercase text-text-muted">Shortlisted</p>
              <p className="font-mono text-text-primary">{td.summary.shortlisted_count}</p>
            </div>
            <div className="rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-1.5">
              <p className="uppercase text-text-muted">Top match</p>
              <p className="font-mono text-fuchsia-300">{td.summary.top_match_score}%</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {(td.summary.key_skills_detected || []).map((h) => (
              <Pill key={h} className="bg-fuchsia-950/40 text-fuchsia-200 border border-fuchsia-400/20">
                {h}
              </Pill>
            ))}
          </div>

          <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
            {(td.shortlisted_candidates || []).slice(0, 5).map((c) => {
              const riskClass =
                c.risk_level === 'high'
                  ? 'text-red-200 border-red-400/30 bg-red-950/30'
                  : c.risk_level === 'medium'
                    ? 'text-amber-200 border-amber-400/30 bg-amber-950/30'
                    : 'text-emerald-200 border-emerald-400/30 bg-emerald-950/30'
              return (
                <div key={c.name} className="rounded-lg border border-white/[0.08] bg-black/20 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-text-primary truncate">{c.name}</p>
                      <p className="text-[10px] text-text-muted">{c.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-mono text-fuchsia-300">{c.match_score}%</p>
                      <p className="text-[10px] text-text-muted">conf {c.confidence_score}%</p>
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-text-muted leading-snug">{c.experience_summary}</p>
                  <p className="mt-1 text-[10px] text-text-primary/90">Strength: {c.strengths?.[0]}</p>
                  <p className="text-[10px] text-text-muted">Gap: {c.gaps?.[0] || 'No critical gaps reported'}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <Pill className={riskClass}>Risk {c.risk_level}</Pill>
                    <a
                      href={c.profile_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-fuchsia-200 hover:text-fuchsia-100 underline underline-offset-2 truncate"
                      title={c.profile_link}
                    >
                      Profile
                    </a>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
            <p className="text-[10px] uppercase text-text-muted mb-1">Insights</p>
            <p className="text-[10px] text-text-primary/90">Strength: {(td.insights?.common_strengths || [])[0]}</p>
            <p className="text-[10px] text-text-muted">Gap: {(td.insights?.common_gaps || [])[0]}</p>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {(td.recommended_actions || []).slice(0, 3).map((a) => (
              <span key={a} className="text-[10px] px-2 py-0.5 rounded-md border border-white/[0.1] bg-white/[0.03] text-text-muted">
                {a}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-fuchsia-300/90 flex items-center gap-1">
            <Users size={11} />
            Hiring intelligence output
          </p>
        </div>
        {resizeGrip}
      </div>
    )
  }

  if (output.variant === 'supply') {
    const sd = output.supplyDecision || {
      forecast: {
        total_demand: 980,
        daily_forecast: [132, 140, 145, 138, 142, 139, 144],
        confidence_score: 81,
      },
      risk_summary: {
        overall_risk_level: 'medium',
        stockout_risk: 'medium',
        coverage_percent: 89,
      },
      scenarios: [
        {
          name: 'Supplier Delay',
          impact: 'Lead time +2 days',
          risk_level: 'high',
          expected_issue: 'Coverage dips on high-velocity SKUs',
          recommended_action: 'Expedite critical replenishment',
          estimated_loss_if_ignored: '$32000',
        },
        {
          name: 'Demand Spike',
          impact: 'Demand +15% for 3 days',
          risk_level: 'medium',
          expected_issue: 'Potential short-picks in key lanes',
          recommended_action: 'Pre-allocate buffer inventory',
          estimated_loss_if_ignored: '$18000',
        },
      ],
      insights: {
        key_driver: 'Lead-time variance',
        inventory_status: 'Insufficient',
      },
      recommended_plan: {
        action: 'Rebalance safety stock for top SKUs',
        expected_benefit: 'Improves fill rate and reduces stockout risk',
        confidence: 79,
      },
      validity: {
        generated_at: new Date().toISOString(),
        forecast_window: '7 days',
      },
    }

    const riskClass = (r) =>
      r === 'high'
        ? 'text-red-200 border-red-400/30 bg-red-950/30'
        : r === 'medium'
          ? 'text-amber-200 border-amber-400/30 bg-amber-950/30'
          : 'text-emerald-200 border-emerald-400/30 bg-emerald-950/30'
    return (
      <div
        className={`${shell} border-emerald-400/30 bg-[#050f0c]/95 ring-1 ring-emerald-500/15`}
        style={{ ...cardCommonStyle, boxShadow: `0 0 40px -12px ${output.accent}50` }}
      >
        {head}
        <div className="overflow-y-auto pr-1 h-[calc(100%-56px)]">
          <div className="grid grid-cols-3 gap-1.5 mb-2 text-center">
            <div className="rounded-md bg-emerald-950/40 border border-emerald-500/20 py-1.5">
              <p className="text-[9px] text-text-muted uppercase">Total demand</p>
              <p className="text-sm font-bold text-emerald-200">{sd.forecast.total_demand}</p>
            </div>
            <div className="rounded-md bg-surface-2/80 border border-white/[0.06] py-1.5">
              <p className="text-[9px] text-text-muted uppercase">Confidence</p>
              <p className="text-sm font-bold text-text-primary">{sd.forecast.confidence_score}%</p>
            </div>
            <div className="rounded-md bg-surface-2/80 border border-white/[0.06] py-1.5">
              <p className="text-[9px] text-text-muted uppercase">Coverage</p>
              <p className="text-sm font-bold text-emerald-300">{sd.risk_summary.coverage_percent}%</p>
            </div>
          </div>

          <div className="mb-2 rounded-lg border border-white/[0.08] bg-black/20 p-2">
            <p className="text-[10px] uppercase tracking-wide text-text-muted mb-1">Daily forecast</p>
            <div className="grid grid-cols-7 gap-1">
              {(sd.forecast.daily_forecast || []).slice(0, 7).map((v, i) => (
                <div key={`${v}-${i}`} className="rounded bg-white/[0.03] border border-white/[0.08] px-1 py-1 text-center">
                  <p className="text-[9px] text-text-muted">D{i + 1}</p>
                  <p className="text-[10px] font-mono text-text-primary">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-2 flex items-center gap-1.5 flex-wrap">
            <Pill className={riskClass(sd.risk_summary.overall_risk_level)}>
              Overall {sd.risk_summary.overall_risk_level}
            </Pill>
            <Pill className={riskClass(sd.risk_summary.stockout_risk)}>
              Stockout {sd.risk_summary.stockout_risk}
            </Pill>
          </div>

          <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
            {(sd.scenarios || []).slice(0, 3).map((s) => (
              <div key={s.name} className="rounded-md border border-white/[0.08] bg-black/20 px-2 py-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold text-text-primary">{s.name}</p>
                  <Pill className={riskClass(s.risk_level)}>{s.risk_level}</Pill>
                </div>
                <p className="text-[10px] text-text-muted mt-0.5">Impact: {s.impact}</p>
                <p className="text-[10px] text-text-muted">Issue: {s.expected_issue}</p>
                <p className="text-[10px] text-text-primary/90">Action: {s.recommended_action}</p>
                <p className="text-[10px] text-red-200/90">Loss if ignored: {s.estimated_loss_if_ignored}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
            <p className="text-[10px] uppercase text-text-muted mb-1">Recommended plan</p>
            <p className="text-[10px] text-text-primary">{sd.recommended_plan.action}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{sd.recommended_plan.expected_benefit}</p>
            <p className="text-[10px] text-emerald-300 mt-0.5">Confidence {sd.recommended_plan.confidence}%</p>
          </div>

          <p className="mt-2 text-[10px] text-text-muted leading-snug">
            Driver: {sd.insights.key_driver} · Inventory: {sd.insights.inventory_status}
          </p>
          <p className="mt-1 text-[10px] text-text-muted leading-snug">
            Validity: {sd.validity.generated_at} · Window: {sd.validity.forecast_window}
          </p>
          <p className="mt-2 text-[10px] text-emerald-300/90 flex items-center gap-1">
            <Package size={11} />
            Supply chain decision engine
          </p>
        </div>
        {resizeGrip}
      </div>
    )
  }

  if (output.variant === 'geo') {
    const dec = output.geoDecision || { overall_score: 75, grade: 'B+', confidence_score: 80, factors: [], insights: {}, recommendation: {}, risk_level: 'low', what_if: {}, validity: {} }
    const riskClass = dec.risk_level === 'high'
      ? 'text-red-200 border-red-400/30 bg-red-950/30'
      : dec.risk_level === 'medium'
        ? 'text-amber-200 border-amber-400/30 bg-amber-950/30'
        : 'text-emerald-200 border-emerald-400/30 bg-emerald-950/30'

    const recClass = dec.recommendation?.decision === 'Not Recommended'
      ? 'border-red-500/30 bg-red-950/20 text-red-100'
      : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-100'

    return (
      <div
        className={`${shell} border-red-400/28 bg-[#120808]/95 ring-1 ring-red-500/15`}
        style={{ ...cardCommonStyle, boxShadow: `0 0 40px -12px ${output.accent}45` }}
      >
        {head}
        <div className="overflow-y-auto pr-1 h-[calc(100%-56px)]">
          <div className="flex items-start gap-2 mb-2 rounded-lg border border-red-500/15 bg-red-950/20 p-2">
            <MapPinned size={18} className="text-red-300 shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-primary/95 leading-snug">{output.address}</p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-2 text-center">
            <div className="rounded-md bg-red-950/40 border border-red-500/20 py-1.5">
              <p className="text-[9px] text-text-muted uppercase">Suitability</p>
              <p className="text-sm font-bold text-red-200">{dec.overall_score} / 100</p>
            </div>
            <div className="rounded-md bg-surface-2/80 border border-white/[0.06] py-1.5">
              <p className="text-[9px] text-text-muted uppercase">Grade</p>
              <p className="text-sm font-bold text-text-primary">{dec.grade}</p>
            </div>
            <div className="rounded-md bg-surface-2/80 border border-white/[0.06] py-1.5">
              <p className="text-[9px] text-text-muted uppercase">Confidence</p>
              <p className="text-sm font-bold text-red-300">{dec.confidence_score}%</p>
            </div>
          </div>

          <div className="mb-2 rounded-lg border border-white/[0.08] bg-black/20 p-2">
            <p className="text-[10px] uppercase tracking-wide text-text-muted mb-1.5">Evaluation Factors</p>
            <div className="space-y-2">
              {(dec.factors || []).map((f) => (
                <div key={f.name}>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-text-primary font-medium">{f.name}</span>
                    <span className="font-mono text-red-200">{f.score}/100</span>
                  </div>
                  <p className="text-[9px] text-text-muted truncate mt-0.5" title={f.insight}>{f.insight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="rounded-md border border-white/[0.08] bg-white/[0.03] p-2">
              <p className="text-[9px] uppercase text-text-muted mb-1">Strengths</p>
              <ul className="space-y-0.5 pl-2 list-disc list-inside text-[9px] text-emerald-200/90 leading-snug">
                {(dec.insights?.strengths || []).map(s => <li key={s} className="truncate" title={s}>{s}</li>)}
              </ul>
            </div>
            <div className="rounded-md border border-white/[0.08] bg-white/[0.03] p-2">
              <p className="text-[9px] uppercase text-text-muted mb-1">Weaknesses</p>
              <ul className="space-y-0.5 pl-2 list-disc list-inside text-[9px] text-amber-200/90 leading-snug">
                {(dec.insights?.weaknesses || []).map(w => <li key={w} className="truncate" title={w}>{w}</li>)}
              </ul>
            </div>
          </div>

          <div className={`mb-2 rounded-md border ${recClass} px-2 py-1.5`}>
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase font-semibold mb-1">Decision: {dec.recommendation?.decision}</p>
              <Pill className={riskClass}>Risk {dec.risk_level}</Pill>
            </div>
            <p className="text-[10px] opacity-90 leading-snug">{dec.recommendation?.reason}</p>
            <p className="mt-1 text-[9px] font-mono opacity-80">Use case: {dec.recommendation?.best_use_case}</p>
          </div>

          <div className="mb-2 rounded-md border border-white/[0.08] bg-black/20 px-2 py-1.5">
            <p className="text-[10px] uppercase.text-text-muted mb-1 font-medium">Scenario Planning</p>
            <p className="text-[9px] text-text-muted leading-snug">• {dec.what_if?.scenario_1}</p>
            <p className="text-[9px] text-text-muted leading-snug">• {dec.what_if?.scenario_2}</p>
          </div>

          <div className="flex items-center justify-between mt-auto border-t border-white/[0.06] pt-2">
            <p className="text-[10px] text-red-300/90 flex items-center gap-1">
              <MapPin size={11} />
              Location Intelligence
            </p>
            <p className="text-[9px] font-mono text-text-muted">
              {dec.validity?.analyzed_at}
            </p>
          </div>
        </div>
        {resizeGrip}
      </div>
    )
  }

  return (
    <div className={`${shell} border-white/15 bg-surface/95 p-3`} style={{ ...cardCommonStyle }}>
      {head}
      <div className="overflow-y-auto pr-1 h-[calc(100%-56px)]">
        <p className="text-sm text-text-muted">{output.summary}</p>
        <Sparkles size={12} className="mt-2 text-accent-light" />
      </div>
      {resizeGrip}
    </div>
  )
}

function FinOpsChart({ output }) {
  const [reveal, setReveal] = useState(false)
  const [hoverIdx, setHoverIdx] = useState(null)

  const series = useMemo(() => {
    const delta = Number.parseFloat(String(output.deltaPct || '0')) || 0
    const forecast = Number.parseFloat(String(output.forecastK || '0')) || 0

    const baseline = Math.max(10, forecast / Math.max(1.01, 1 + delta / 100))
    const day1 = baseline * 0.94
    const day2 = baseline * 0.97
    const day3 = baseline * (1 + (delta * 0.2) / 100)
    const day4 = baseline * (1 + (delta * 0.38) / 100)
    const day5 = baseline * (1 + (delta * 0.56) / 100)
    const day6 = baseline * (1 + (delta * 0.75) / 100)
    const day7 = Math.max(forecast, baseline * (1 + delta / 100))

    const spend = [
      { label: 'D1', value: day1 },
      { label: 'D2', value: day2 },
      { label: 'D3', value: day3 },
      { label: 'D4', value: day4 },
      { label: 'D5', value: day5 },
      { label: 'D6', value: day6 },
      { label: 'D7', value: day7 },
    ]
    const riskBase = Math.min(92, Math.max(18, 44 + delta * 1.05))
    const risk = spend.map((p, i) => {
      const t = i / 6
      const wave = Math.sin((i + 1) * 1.1) * 4
      const drift = delta * 0.12 * t
      const score = Math.max(5, Math.min(99, riskBase + wave + drift))
      return { label: p.label, value: Number(score.toFixed(1)) }
    })
    return { spend, risk }
  }, [output.deltaPct, output.forecastK])

  useEffect(() => {
    setReveal(false)
    setHoverIdx(null)
    const id = window.requestAnimationFrame(() => setReveal(true))
    return () => window.cancelAnimationFrame(id)
  }, [output.deltaPct, output.forecastK, output.topService, output.region, output.anomalyNote])

  const spendMax = Math.max(...series.spend.map((p) => p.value), 1) * 1.15
  const spendMin = Math.max(0, Math.min(...series.spend.map((p) => p.value)) * 0.9)
  const riskMax = 100
  const riskMin = 0
  const W = 560
  const H = 220
  const P = 22
  const X = (i) => P + (i * (W - P * 2)) / (series.spend.length - 1)
  const YSpend = (v) => H - P - ((v - spendMin) / Math.max(1, spendMax - spendMin)) * (H - P * 2)
  const YRisk = (v) => H - P - ((v - riskMin) / Math.max(1, riskMax - riskMin)) * (H - P * 2)

  const spendPath = series.spend
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${X(i)} ${YSpend(p.value)}`)
    .join(' ')
  const riskPath = series.risk
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${X(i)} ${YRisk(p.value)}`)
    .join(' ')
  const areaPath = `${spendPath} L ${X(series.spend.length - 1)} ${H - P} L ${X(0)} ${H - P} Z`
  const activePoint = hoverIdx == null
    ? null
    : {
      idx: hoverIdx,
      x: X(hoverIdx),
      spendY: YSpend(series.spend[hoverIdx].value),
      riskY: YRisk(series.risk[hoverIdx].value),
      day: series.spend[hoverIdx].label,
      spend: series.spend[hoverIdx].value,
      risk: series.risk[hoverIdx].value,
    }

  return (
    <div className="rounded-lg border border-sky-500/20 bg-sky-950/20 p-2.5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[10px] uppercase tracking-wide text-sky-200/80">FinOps trend graph</p>
        <span className="text-[10px] font-mono text-text-muted">
          {output.topService} · {output.region}
        </span>
      </div>

      <div className="rounded-md border border-white/[0.06] bg-[#070b12] p-2.5">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[210px] w-full overflow-visible">
          <defs>
            <linearGradient id="finopsLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
            <linearGradient id="riskLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
            <linearGradient id="finopsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((r) => (
            <line
              key={r}
              x1={P}
              x2={W - P}
              y1={P + r * (H - P * 2)}
              y2={P + r * (H - P * 2)}
              stroke="rgba(148,163,184,0.2)"
              strokeDasharray="3 4"
            />
          ))}

          <path d={areaPath} fill="url(#finopsArea)" />
          <path
            d={spendPath}
            fill="none"
            stroke="url(#finopsLine)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1200,
              strokeDashoffset: reveal ? 0 : 1200,
              transition: 'stroke-dashoffset 950ms cubic-bezier(0.22, 1, 0.36, 1)',
              filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.5))',
            }}
          />
          <path
            d={riskPath}
            fill="none"
            stroke="url(#riskLine)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="7 6"
            style={{
              strokeDashoffset: reveal ? 0 : 900,
              transition: 'stroke-dashoffset 1050ms cubic-bezier(0.22, 1, 0.36, 1)',
              filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.35))',
            }}
          />

          {series.spend.map((p, i) => (
            <g key={p.label}>
              <rect
                x={X(i) - (W - P * 2) / (series.spend.length - 1) / 2}
                y={P}
                width={(W - P * 2) / (series.spend.length - 1)}
                height={H - P * 2}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseMove={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: 'crosshair' }}
              />
              <g
                style={{
                  opacity: reveal ? 1 : 0,
                  transform: `translateY(${reveal ? 0 : 6}px)`,
                  transition: `all 520ms ease ${i * 70}ms`,
                }}
              >
                <circle cx={X(i)} cy={YSpend(p.value)} r="4" fill="#7DD3FC" />
                <circle cx={X(i)} cy={YRisk(series.risk[i].value)} r="3.5" fill="#FDBA74" />
                <text x={X(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#94A3B8">
                  {p.label}
                </text>
              </g>
            </g>
          ))}

          {activePoint && (
            <g pointerEvents="none">
              <line
                x1={activePoint.x}
                y1={P}
                x2={activePoint.x}
                y2={H - P}
                stroke="rgba(148,163,184,0.45)"
                strokeDasharray="3 4"
              />
              <circle cx={activePoint.x} cy={activePoint.spendY} r="5.5" fill="#7DD3FC" />
              <circle cx={activePoint.x} cy={activePoint.riskY} r="5" fill="#FDBA74" />
              <g transform={`translate(${Math.min(W - 154, activePoint.x + 10)}, ${Math.max(P + 4, Math.min(H - 66, activePoint.spendY - 34))})`}>
                <rect width="148" height="58" rx="8" fill="rgba(2,6,23,0.92)" stroke="rgba(148,163,184,0.35)" />
                <text x="8" y="14" fill="#CBD5E1" fontSize="10">{activePoint.day}</text>
                <text x="8" y="30" fill="#7DD3FC" fontSize="10">Spend: {activePoint.spend.toFixed(1)}k</text>
                <text x="8" y="45" fill="#FDBA74" fontSize="10">Risk: {activePoint.risk.toFixed(1)}</text>
              </g>
            </g>
          )}
        </svg>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2 text-[10px]">
        <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
          <p className="uppercase text-text-muted">Delta</p>
          <p className="font-mono text-sky-200">+{output.deltaPct}%</p>
        </div>
        <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
          <p className="uppercase text-text-muted">Forecast</p>
          <p className="font-mono text-text-primary">{output.forecastK}k</p>
        </div>
        <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
          <p className="uppercase text-text-muted">Driver</p>
          <p className="font-mono text-text-primary truncate" title={output.topService}>{output.topService}</p>
        </div>
        <div className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
          <p className="uppercase text-text-muted">Risk Avg</p>
          <p className="font-mono text-amber-300">
            {(series.risk.reduce((s, p) => s + p.value, 0) / series.risk.length).toFixed(1)}
          </p>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-text-muted/90 leading-snug border-t border-white/[0.06] pt-2">
        {output.anomalyNote}
      </p>
    </div>
  )
}
