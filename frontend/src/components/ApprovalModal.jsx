import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

const TIMEOUT_SECONDS = 60

export default function ApprovalModal({ data, onApprove, onReject }) {
  const [countdown, setCountdown] = useState(TIMEOUT_SECONDS)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onReject()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onReject])

  const pct = (countdown / TIMEOUT_SECONDS) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" aria-hidden />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-warning/35 bg-surface/95 backdrop-blur-xl
          shadow-panel overflow-hidden animate-scale-in"
      >
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.35),transparent)]" />

        <div className="relative flex items-center gap-3 px-6 py-4 border-b border-white/[0.08] bg-warning/10">
          <div className="w-11 h-11 rounded-xl bg-warning/20 border border-warning/40 flex items-center justify-center flex-shrink-0 shadow-glow-sm">
            <AlertTriangle size={22} className="text-warning" />
          </div>
          <div>
            <h2 className="font-bold text-text-primary text-base tracking-tight">Human Approval Required</h2>
            <p className="text-xs text-text-muted mt-0.5">The agent wants to perform a destructive action</p>
          </div>
        </div>

        <div className="relative px-6 py-5 space-y-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Requested Action</p>
            <div className="bg-surface-2/90 rounded-xl p-4 border border-white/[0.08] transition-shadow duration-300 hover:shadow-md">
              <p className="text-sm text-text-primary font-medium leading-relaxed">
                {data?.action || 'Close GitHub issue #142 and archive related Jira ticket BE-891'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailItem label="Tool" value={data?.tool || 'GitHub + Jira'} />
            <DetailItem label="Expected Outcome" value={data?.outcome || 'Issue closed, ticket archived'} />
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-error/10 border border-error/30">
            <AlertTriangle size={14} className="text-error flex-shrink-0 mt-0.5" />
            <p className="text-xs text-error leading-relaxed">
              This action <strong>cannot be undone</strong>. Review carefully before approving.
            </p>
          </div>
        </div>

        <div className="relative px-6 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Clock size={11} className="opacity-80" />
              Auto-reject in
            </span>
            <span className={`text-xs font-mono font-bold tabular-nums transition-colors duration-300 ${countdown <= 10 ? 'text-error scale-110' : 'text-warning'}`}>
              {countdown}s
            </span>
          </div>
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden border border-white/[0.06]">
            <div
              className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${countdown <= 10 ? 'bg-error shadow-[0_0_12px_rgba(248,113,113,0.5)]' : 'bg-warning shadow-[0_0_12px_rgba(251,191,36,0.35)]'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="relative flex gap-3 px-6 py-4 border-t border-white/[0.08] bg-black/20">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              bg-surface-2 border border-white/[0.1] text-text-primary text-sm font-semibold
              hover:bg-red-950/30 hover:border-error/40 hover:text-error transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <XCircle size={16} />
            Reject
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              bg-emerald-500/15 border border-success/45 text-success text-sm font-semibold
              hover:bg-emerald-500/25 hover:shadow-[0_0_24px_-6px_rgba(52,211,153,0.45)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <CheckCircle size={16} />
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="bg-surface-2/80 rounded-xl p-3 border border-white/[0.08] transition-all duration-300 hover:border-accent/25">
      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-text-primary font-mono leading-snug">{value}</p>
    </div>
  )
}
