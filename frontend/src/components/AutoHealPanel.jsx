import React, { useMemo, useState } from 'react'
import { Wand2, Github, FileText, Bug, ExternalLink } from 'lucide-react'
import { healBug } from '../services/api.js'

export default function AutoHealPanel({ showToast }) {
  const [bug, setBug] = useState('')
  const [repo, setRepo] = useState('')
  const [filePath, setFilePath] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const canRun = bug.trim().length > 0 && !loading

  const prHref = useMemo(() => {
    const u = result?.pr_url
    return typeof u === 'string' && u.startsWith('http') ? u : null
  }, [result])

  const run = async () => {
    if (!canRun) return
    setLoading(true)
    setResult(null)
    try {
      const data = await healBug({ input: bug.trim(), repo: repo.trim(), filePath: filePath.trim() })
      setResult(data)
      showToast?.('Auto-heal complete', 'success')
    } catch (e) {
      setResult({ steps: [], fix: '', pr_url: null, error: e.message || 'Auto-heal failed' })
      showToast?.(e.message || 'Auto-heal failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section data-tour="auto-heal-panel" className="rounded-2xl border border-accent/25 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 border border-accent/25">
            <Wand2 size={18} className="text-accent-light" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text-primary">Auto-healing</h3>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Describe the bug and get a proposed patch from the backend healer.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-md border border-white/[0.10] bg-white/[0.02] px-2 py-1 text-[10px] font-mono text-text-muted/80">
          /agent/heal
        </span>
      </div>

      <div className="mt-4 space-y-3.5">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            <Bug size={12} />
            Bug description
          </span>
          <textarea
            value={bug}
            onChange={(e) => setBug(e.target.value)}
            placeholder="What’s broken? Include steps to reproduce and expected vs actual behavior."
            rows={4}
            className="w-full resize-none rounded-xl border border-white/[0.10] bg-surface-2/70 px-3 py-2.5 text-sm leading-relaxed
              text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>

        <div className="grid grid-cols-1 gap-3">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              <Github size={12} />
              Repo (optional)
            </span>
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repo"
              className="h-11 w-full rounded-xl border border-white/[0.10] bg-surface-2/70 px-3 text-sm
                text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              <FileText size={12} />
              File path (optional)
            </span>
            <input
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="frontend/src/components/ChatBox.jsx"
              className="h-11 w-full rounded-xl border border-white/[0.10] bg-surface-2/70 px-3 text-sm
                text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={!canRun}
          className="h-11 w-full btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Healing…
            </>
          ) : (
            <>
              <Wand2 size={14} />
              Auto-heal bug
            </>
          )}
        </button>

        {result?.error && (
          <div className="rounded-xl border border-error/30 bg-red-950/25 px-3 py-2 text-xs text-error">
            {result.error}
          </div>
        )}

        {Array.isArray(result?.steps) && result.steps.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-2">
              Healing steps
            </p>
            <div className="space-y-2">
              {result.steps.map((s, i) => (
                <div
                  key={`${s.step}-${i}`}
                  className="flex items-start gap-2.5 rounded-xl border border-success/25 bg-emerald-950/15 px-3 py-2"
                >
                  <span className="mt-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-md bg-success/20 text-[11px] font-mono text-success">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12px] text-success/95 leading-relaxed break-words">{s.step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {typeof result?.fix === 'string' && result.fix.trim() && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-2">
              Proposed fix
            </p>
            <pre className="max-h-[260px] overflow-auto rounded-xl border border-white/[0.10] bg-[#0a0912] p-3 text-[12px] leading-relaxed text-text-primary whitespace-pre-wrap">
              {result.fix}
            </pre>
          </div>
        )}

        {prHref && (
          <a
            href={prHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-success/35 bg-emerald-950/25 px-4 py-2.5
              text-xs font-bold text-success hover:bg-emerald-950/35 transition-colors"
          >
            View generated PR
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </section>
  )
}

