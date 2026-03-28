import React, { useContext, useRef, useEffect, useState } from 'react'
import { AppContext } from '../App.jsx'
import {
  CheckCircle,
  XCircle,
  Loader,
  Clock,
  GitBranch,
  Trello,
  Slack,
  FileSpreadsheet,
  Cpu,
  Globe,
  Copy,
  Pin,
  PinOff,
} from 'lucide-react'

const TOOL_ICONS = {
  github: GitBranch,
  jira: Trello,
  slack: Slack,
  sheets: FileSpreadsheet,
  claude: Cpu,
  maps: Globe,
}

const STATUS_CONFIG = {
  running: {
    dot: 'bg-warning animate-pulse',
    icon: Loader,
    iconClass: 'text-warning animate-spin',
    rowClass: 'border-warning/30 bg-amber-950/15',
  },
  done: {
    dot: 'bg-success shadow-[0_0_6px_rgba(52,211,153,0.6)]',
    icon: CheckCircle,
    iconClass: 'text-success',
    rowClass: 'border-success/25 bg-emerald-950/12',
  },
  error: {
    dot: 'bg-error',
    icon: XCircle,
    iconClass: 'text-error',
    rowClass: 'border-error/25 bg-red-950/12',
  },
  pending: {
    dot: 'bg-text-muted',
    icon: Clock,
    iconClass: 'text-text-muted',
    rowClass: 'border-white/[0.06]',
  },
}

const TOOL_CARDS = [
  { id: 'github', label: 'GitHub', color: '#8B5CF6' },
  { id: 'jira', label: 'Jira', color: '#38BDF8' },
  { id: 'slack', label: 'Slack', color: '#FBBF24' },
  { id: 'sheets', label: 'Sheets', color: '#34D399' },
]

export default function ExecutionLog() {
  const { agentState, showToast } = useContext(AppContext)
  const { logs, dagNodes, running } = agentState
  const bottomRef = useRef(null)
  const [followScroll, setFollowScroll] = useState(true)

  useEffect(() => {
    if (!followScroll) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length, followScroll])

  const toolStatus = {}
  dagNodes.forEach((n) => {
    const tool = n.data.tool
    if (!toolStatus[tool] || n.data.status === 'running') {
      toolStatus[tool] = n.data.status || 'pending'
    }
    if (toolStatus[tool] === 'pending' && n.data.status === 'done') {
      toolStatus[tool] = 'done'
    }
  })

  const copyLogs = async () => {
    if (!logs.length) {
      showToast('Nothing to copy yet', 'warning')
      return
    }
    const text = logs.map((l) => `[${l.status}] ${l.step}${l.detail ? ` — ${l.detail}` : ''}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      showToast(`Copied ${logs.length} entries`, 'success')
    } catch {
      showToast('Clipboard unavailable', 'warning')
    }
  }

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0 gap-2 flex-wrap">
        <h3 className="text-sm font-bold text-text-primary tracking-tight">Execution Log</h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setFollowScroll((f) => {
                const next = !f
                showToast(next ? 'Following new steps' : 'Follow-scroll paused', 'default')
                return next
              })
            }}
            title={followScroll ? 'Pause auto-scroll' : 'Resume auto-scroll'}
            className={`rounded-lg p-1.5 transition-all duration-200 border
              ${followScroll
                ? 'border-accent/35 bg-accent/10 text-accent-light hover:shadow-glow-sm'
                : 'border-white/[0.08] text-text-muted hover:text-text-primary hover:bg-white/[0.06]'
              } active:scale-95`}
          >
            {followScroll ? <Pin size={14} /> : <PinOff size={14} />}
          </button>
          <button
            type="button"
            onClick={copyLogs}
            disabled={!logs.length}
            className="rounded-lg p-1.5 border border-white/[0.08] text-text-muted hover:text-accent-light hover:border-accent/35 hover:bg-accent/10 transition-all duration-200 disabled:opacity-40 active:scale-95"
            title="Copy log to clipboard"
          >
            <Copy size={14} />
          </button>
          {running && (
            <span className="flex items-center gap-2 text-xs text-warning font-mono px-2 py-1 rounded-full bg-warning/10 border border-warning/25 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
              Live
            </span>
          )}
          {!running && logs.length > 0 && (
            <span className="text-xs text-text-muted tabular-nums">{logs.length} steps</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-0.5">
        {logs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full min-h-[120px] text-text-muted gap-3 rounded-xl
              border border-dashed border-white/[0.08] bg-white/[0.02] animate-fade-in hover:border-accent/25 transition-colors duration-300"
          >
            <Clock size={26} className="opacity-35 animate-float" />
            <p className="text-xs">Waiting for agent…</p>
          </div>
        ) : (
          logs.map((log, i) => <LogRow key={log.id} log={log} index={i} />)
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 pt-1">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.18em] mb-2">Tool Status</p>
        <div className="grid grid-cols-2 gap-2">
          {TOOL_CARDS.map((card, i) => (
            <ToolCard
              key={card.id}
              card={card}
              status={toolStatus[card.id] || 'pending'}
              delay={i * 45}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function LogRow({ log, index }) {
  const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending
  const Icon = cfg.icon

  return (
    <div
      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border backdrop-blur-sm text-sm
        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md animate-fade-in-up
        ${cfg.rowClass}`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms`, animationFillMode: 'backwards' }}
    >
      <Icon size={14} className={`flex-shrink-0 mt-0.5 ${cfg.iconClass}`} />
      <div className="min-w-0">
        <p className="text-text-primary font-medium leading-snug truncate">{log.step}</p>
        {log.detail && (
          <p className="text-text-muted text-xs mt-1 leading-snug font-mono truncate">{log.detail}</p>
        )}
      </div>
    </div>
  )
}

function ToolCard({ card, status, delay }) {
  const Icon = TOOL_ICONS[card.id] || Cpu

  const statusLabel = {
    pending: 'Pending',
    running: 'In Progress',
    done: 'Done',
    failed: 'Failed',
  }[status] || 'Pending'

  const statusColor = {
    pending: 'text-text-muted',
    running: 'text-warning',
    done: 'text-success',
    failed: 'text-error',
  }[status] || 'text-text-muted'

  const dotColor = {
    pending: 'bg-text-muted',
    running: 'bg-warning animate-pulse',
    done: 'bg-success',
    failed: 'bg-error',
  }[status] || 'bg-text-muted'

  return (
    <button
      type="button"
      className="group card card-interactive p-3 flex items-center gap-2.5 animate-fade-in-up text-left w-full
        active:scale-[0.98]"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
        style={{ background: card.color + '22', border: `1px solid ${card.color}55` }}
      >
        <Icon size={14} style={{ color: card.color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-text-primary">{card.label}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
          <span className={`text-[11px] ${statusColor}`}>{statusLabel}</span>
        </div>
      </div>
    </button>
  )
}
