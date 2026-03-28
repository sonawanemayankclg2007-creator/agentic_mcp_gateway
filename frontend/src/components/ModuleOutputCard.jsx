import React, { useContext } from 'react'
import {
  GitBranch,
  DollarSign,
  MapPin,
  Sparkles,
  Package,
  Tag,
  Users,
  X,
  MessageSquare,
  Ticket,
  TrendingUp,
  MapPinned,
} from 'lucide-react'
import { AppContext } from '../App.jsx'

function Pill({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  )
}

export default function ModuleOutputCard({ output }) {
  const { setAgentState } = useContext(AppContext)
  if (!output) return null

  const dismiss = () => setAgentState((prev) => ({ ...prev, workflowOutput: null }))

  const head = (
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted/90">Output</p>
        <p className="text-sm font-bold text-text-primary leading-tight">{output.title}</p>
        <p className="text-[11px] text-text-muted mt-0.5 truncate" title={output.terminalStep}>
          After · {output.terminalStep}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          dismiss()
        }}
        className="shrink-0 rounded-lg p-1 text-text-muted hover:text-text-primary hover:bg-white/[0.08] transition-colors"
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )

  const shell =
    'pointer-events-auto max-w-[min(100vw-2rem,19rem)] rounded-xl border backdrop-blur-xl shadow-panel text-left animate-fade-in'

  if (output.variant === 'devops') {
    return (
      <div
        className={`${shell} border-violet-500/30 bg-[#0d0a14]/95 ring-1 ring-violet-500/15`}
        style={{ boxShadow: `0 0 40px -12px ${output.accent}66` }}
      >
        {head}
        <div
          className="rounded-lg border border-white/[0.06] bg-surface-2/80 p-2.5 mb-2 text-[11px] leading-relaxed text-text-primary/95"
          style={{ borderLeftWidth: 3, borderLeftColor: output.accent }}
        >
          <div className="flex items-center gap-1.5 text-accent-light/90 mb-1.5">
            <MessageSquare size={12} />
            <span className="font-mono font-semibold">{output.slackChannel}</span>
          </div>
          <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Message preview</p>
          <p className="font-mono text-[11px] text-text-primary/90 whitespace-pre-wrap">{output.summary}</p>
          <p className="mt-2 text-[10px] text-text-muted truncate" title={output.issueHint}>
            Ref · {output.issueHint}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Pill className="bg-amber-950/50 text-warning border border-warning/25">{output.severity}</Pill>
          <Pill className="bg-violet-950/40 text-violet-200 border border-violet-400/25">
            <Ticket size={10} className="mr-1 inline" />
            {output.jiraKey}
          </Pill>
        </div>
        <div className="flex flex-wrap gap-1">
          {(output.prLabels || []).map((l) => (
            <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-text-muted font-mono">
              {l}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-success/90 flex items-center gap-1">
          <GitBranch size={11} />
          DevOps delivery
        </p>
      </div>
    )
  }

  if (output.variant === 'finops') {
    return (
      <div
        className={`${shell} border-sky-500/35 bg-[#060d14]/95 ring-1 ring-sky-500/15`}
        style={{ boxShadow: `0 0 40px -12px ${output.accent}55` }}
      >
        {head}
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
    )
  }

  if (output.variant === 'pricing') {
    return (
      <div
        className={`${shell} border-amber-400/35 bg-[#140f05]/95 ring-1 ring-amber-400/15`}
        style={{ boxShadow: `0 0 40px -12px ${output.accent}44` }}
      >
        {head}
        <div className="rounded-lg border border-amber-500/20 bg-amber-950/25 p-2.5 mb-2">
          <p className="text-[9px] uppercase tracking-wide text-amber-200/70">Recommended price</p>
          <p className="text-2xl font-mono font-bold text-amber-100">
            {output.currency} {output.recommended}
          </p>
          <p className="text-[11px] text-text-muted mt-1 font-mono">{output.sku}</p>
        </div>
        <div className="flex justify-between text-[11px] text-text-muted">
          <span>
            Competitor moves <strong className="text-text-primary">{output.competitorMoves}</strong>
          </span>
          <span className="text-amber-200/80">{output.guardrail}</span>
        </div>
        <p className="mt-2 text-[10px] text-amber-200/90 flex items-center gap-1">
          <Tag size={11} />
          Pricing desk
        </p>
      </div>
    )
  }

  if (output.variant === 'talent') {
    return (
      <div
        className={`${shell} border-fuchsia-400/30 bg-[#120812]/95 ring-1 ring-fuchsia-500/15`}
        style={{ boxShadow: `0 0 40px -12px ${output.accent}55` }}
      >
        {head}
        <p className="text-[11px] text-fuchsia-100/85 mb-2 leading-snug">{output.role}</p>
        <div className="flex gap-3 mb-2">
          <div>
            <p className="text-[9px] uppercase text-text-muted">Shortlist</p>
            <p className="text-xl font-bold text-text-primary">{output.shortlisted}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase text-text-muted">Lead match</p>
            <p className="text-xl font-bold text-fuchsia-300">{output.topMatch}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {(output.highlights || []).map((h) => (
            <Pill key={h} className="bg-fuchsia-950/40 text-fuchsia-200 border border-fuchsia-400/20">
              {h}
            </Pill>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-fuchsia-300/90 flex items-center gap-1">
          <Users size={11} />
          Talent pipeline
        </p>
      </div>
    )
  }

  if (output.variant === 'supply') {
    return (
      <div
        className={`${shell} border-emerald-400/30 bg-[#050f0c]/95 ring-1 ring-emerald-500/15`}
        style={{ boxShadow: `0 0 40px -12px ${output.accent}50` }}
      >
        {head}
        <div className="grid grid-cols-3 gap-1.5 mb-2 text-center">
          <div className="rounded-md bg-emerald-950/40 border border-emerald-500/20 py-1.5">
            <p className="text-[9px] text-text-muted uppercase">Risk</p>
            <p className="text-xs font-bold text-emerald-200">{output.risk}</p>
          </div>
          <div className="rounded-md bg-surface-2/80 border border-white/[0.06] py-1.5">
            <p className="text-[9px] text-text-muted uppercase">Plans</p>
            <p className="text-xs font-bold text-text-primary">{output.scenariosRun}</p>
          </div>
          <div className="rounded-md bg-surface-2/80 border border-white/[0.06] py-1.5">
            <p className="text-[9px] text-text-muted uppercase">Coverage</p>
            <p className="text-xs font-bold text-emerald-300">{output.coverPct}</p>
          </div>
        </div>
        <p className="text-[10px] text-text-muted leading-snug">{output.note}</p>
        <p className="mt-2 text-[10px] text-emerald-300/90 flex items-center gap-1">
          <Package size={11} />
          Supply chain
        </p>
      </div>
    )
  }

  if (output.variant === 'geo') {
    return (
      <div
        className={`${shell} border-red-400/28 bg-[#120808]/95 ring-1 ring-red-500/15`}
        style={{ boxShadow: `0 0 40px -12px ${output.accent}45` }}
      >
        {head}
        <div className="flex items-start gap-2 mb-2 rounded-lg border border-red-500/15 bg-red-950/20 p-2">
          <MapPinned size={18} className="text-red-300 shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-primary/95 leading-snug">{output.address}</p>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] uppercase text-text-muted">Suitability</p>
            <p className="text-2xl font-mono font-bold text-red-200">{output.score}</p>
          </div>
          <Pill className="bg-red-950/50 text-red-200 border border-red-400/25 text-sm normal-case">
            Grade {output.tier}
          </Pill>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {(output.flags || []).map((f) => (
            <span key={f} className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-white/[0.04]">
              {f}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-red-300/90 flex items-center gap-1">
          <MapPin size={11} />
          GeoSpatial
        </p>
      </div>
    )
  }

  return (
    <div className={`${shell} border-white/15 bg-surface/95 p-3`}>
      {head}
      <p className="text-xs text-text-muted">{output.summary}</p>
      <Sparkles size={12} className="mt-2 text-accent-light" />
    </div>
  )
}
