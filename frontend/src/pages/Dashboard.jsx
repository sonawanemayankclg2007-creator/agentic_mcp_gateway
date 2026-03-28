import React, { useContext, useState, useEffect, useCallback, useRef } from 'react'
import { AppContext } from '../App.jsx'
import ChatBox from '../components/ChatBox.jsx'
import DAGView from '../components/DAGView.jsx'
import ExecutionLog from '../components/ExecutionLog.jsx'
import SettingsPanel from '../components/SettingsPanel.jsx'
import {
  GitBranch, DollarSign, Tag, Users, Package, MapPin,
  Activity, Settings, ChevronRight, Wifi, WifiOff,
  Zap, BarChart2, Clock, Shield, PanelLeftClose, PanelLeft,
  Sparkles, Cpu, Move3d, Focus,
} from 'lucide-react'
import { readGraphicsQuality, writeGraphicsQuality } from '../utils/graphicsQualityStorage.js'

const MODULES = [
  { id: 'DevOps', label: 'DevOps', icon: GitBranch, ps: 'PS6', color: '#8B5CF6', desc: 'Triage · Jira · Slack' },
  { id: 'FinOps', label: 'FinOps', icon: DollarSign, ps: 'PS1', color: '#38BDF8', desc: 'Anomaly · Forecast' },
  { id: 'Pricing', label: 'Pricing', icon: Tag, ps: 'PS3', color: '#FBBF24', desc: 'Dynamic · Sheets' },
  { id: 'Talent', label: 'Talent', icon: Users, ps: 'PS9', color: '#F472B6', desc: 'Resume · Match' },
  { id: 'Supply Chain', label: 'Supply Chain', icon: Package, ps: 'PS5', color: '#34D399', desc: 'Demand · Scenarios' },
  { id: 'GeoSpatial', label: 'GeoSpatial', icon: MapPin, ps: 'PS7', color: '#F87171', desc: 'Location · Score' },
]

const INTEGRATIONS = [
  { id: 'github', label: 'GitHub', online: true },
  { id: 'jira', label: 'Jira', online: true },
  { id: 'slack', label: 'Slack', online: true },
  { id: 'sheets', label: 'Sheets', online: true },
]

export default function Dashboard() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg text-text-primary p-6 text-sm">
        Application context is missing. Check that <code className="font-mono text-accent-light">App.jsx</code>{' '}
        wraps the dashboard with <code className="font-mono text-accent-light">AppContext.Provider</code>.
      </div>
    )
  }
  const { agentState, setAgentState, showToast, prefillChat } = ctx
  const { currentModule, stats, running } = agentState
  const [recentRuns] = useState([
    { id: 'wf_001', module: 'DevOps', input: 'Login failed on mobile #142', time: '8s', status: 'done' },
    { id: 'wf_002', module: 'FinOps', input: 'AWS spend anomaly detected', time: '11s', status: 'done' },
    { id: 'wf_003', module: 'Talent', input: 'Senior React Engineer role', time: '14s', status: 'done' },
  ])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [reducedMotionSystem, setReducedMotionSystem] = useState(false)
  const [gfxQuality, setGfxQuality] = useState(() => readGraphicsQuality())
  const [orbitMode, setOrbitMode] = useState(false)
  const dagRef = useRef(null)

  const hasWorkflowGraph = agentState.dagNodes.length > 0

  useEffect(() => {
    writeGraphicsQuality(gfxQuality)
  }, [gfxQuality])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotionSystem(mq.matches)
    const fn = () => setReducedMotionSystem(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const setModule = useCallback(
    (id) => {
      if (!running) setAgentState((prev) => ({ ...prev, currentModule: id }))
    },
    [running, setAgentState]
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches('input, textarea, select')) return
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= 6 && !running && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const mod = MODULES[n - 1]
        if (mod && mod.id !== currentModule) {
          setModule(mod.id)
          showToast(`Switched to ${mod.label}`, 'default')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running, setModule, showToast, currentModule])

  const pingIntegration = (int) => {
    const ms = 28 + Math.round(Math.random() * 72)
    showToast(`${int.label} · ${ms}ms`, 'success')
  }

  const pingAllIntegrations = () => {
    INTEGRATIONS.forEach((int, i) => {
      window.setTimeout(() => pingIntegration(int), i * 360)
    })
  }

  const copyStat = async (label, value) => {
    const line = `${label}: ${value}`
    try {
      await navigator.clipboard.writeText(line)
      showToast(`Copied “${line}”`, 'success')
    } catch {
      showToast('Copy not available', 'warning')
    }
  }

  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 app-shell-grid z-0 opacity-[0.85]" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-6 py-3.5 flex-shrink-0 glass-header">
        <div
          className="flex items-center gap-3.5 animate-fade-in-up cursor-default"
          style={{ animationDelay: '0ms' }}
        >
          <div className="relative group/logo">
            <div
              className="absolute inset-[-6px] rounded-2xl opacity-60 logo-orbit transition-opacity group-hover/logo:opacity-90"
              style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(139,92,246,0.45), transparent 40%)',
              }}
            />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-accent-deep via-accent to-indigo-500 flex items-center justify-center shadow-glow-sm animate-glow-pulse group-hover/logo:scale-105 transition-transform duration-300">
              <Zap size={18} fill="white" className="text-white" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg text-text-primary tracking-tight">AVEOps</span>
            <span className="ml-2 text-[11px] text-text-muted font-mono tracking-wide hidden sm:inline">
              Agentic MCP Gateway
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
          <StatPill
            icon={Activity}
            label="Handled"
            value={stats.handled}
            delay={60}
            onCopy={() => copyStat('Handled', stats.handled)}
          />
          <StatPill
            icon={Clock}
            label="Avg"
            value={`${stats.avgTime}s`}
            delay={100}
            onCopy={() => copyStat('Avg', `${stats.avgTime}s`)}
          />
          <StatPill
            icon={Shield}
            label="Integrations"
            value={stats.integrations}
            delay={140}
            onCopy={() => copyStat('Integrations', stats.integrations)}
          />
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setGfxQuality((q) => (q === 'high' ? 'low' : 'high'))}
              title={
                gfxQuality === 'high'
                  ? 'Switch to performance (lower GPU use)'
                  : 'Switch to quality (richer lighting & meshes)'
              }
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide
                backdrop-blur-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95
                ${gfxQuality === 'high'
                  ? 'border-accent/40 bg-accent/15 text-accent-light hover:shadow-glow-sm'
                  : 'border-white/[0.12] bg-white/[0.06] text-text-primary hover:border-success/35 hover:text-success'
                }`}
            >
              {gfxQuality === 'high' ? (
                <>
                  <Sparkles size={13} strokeWidth={2.2} className="text-accent-light" />
                  <span>Quality</span>
                </>
              ) : (
                <>
                  <Cpu size={13} strokeWidth={2.2} className="text-success" />
                  <span>Performance</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={!hasWorkflowGraph}
              onClick={() => setOrbitMode((o) => !o)}
              title={
                !hasWorkflowGraph
                  ? 'Run a workflow to enable 3D orbit vs graph editing'
                  : orbitMode
                    ? 'Back to graph — drag nodes, pan canvas, select steps'
                    : '3D orbit — drag to rotate, scroll to zoom, right-drag to pan'
              }
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide
                backdrop-blur-sm shadow-sm transition-all duration-200 active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
                ${orbitMode
                  ? 'border-accent/50 bg-accent/20 text-accent-light hover:shadow-glow-sm'
                  : 'border-white/[0.12] bg-white/[0.06] text-text-primary hover:border-accent/35 hover:text-accent-light'
                }`}
            >
              <Move3d size={13} className={orbitMode ? 'text-accent-light' : 'text-accent-light/90'} />
              {orbitMode ? 'Graph' : '3D orbit'}
            </button>
            <button
              type="button"
              disabled={!hasWorkflowGraph}
              onClick={() => dagRef.current?.fitView?.()}
              title={hasWorkflowGraph ? 'Fit workflow to view' : 'Run a workflow first'}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1.5
                text-[11px] font-bold text-text-primary backdrop-blur-sm shadow-sm transition-all duration-200
                hover:border-accent/35 hover:text-accent-light hover:shadow-glow-sm active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Focus size={13} className="text-accent-light" />
              Fit
            </button>
          </div>
          {running && (
            <div
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/35
                bg-accent/15 shadow-glow-sm animate-scale-in"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-light opacity-40" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-light" />
              </span>
              <span className="text-xs text-accent-light font-semibold tracking-wide">Agent Running</span>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-[1] flex flex-1 overflow-hidden min-h-0">
        <aside
          className={`flex-shrink-0 flex flex-col border-r border-white/[0.06] glass-sidebar overflow-y-auto overflow-x-hidden transition-[width] duration-300 ease-out ${
            sidebarCollapsed ? 'w-[3.65rem]' : 'w-60'
          }`}
        >
          <div className="flex items-center justify-end p-2 border-b border-white/[0.05]">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="rounded-lg p-2 text-text-muted hover:text-accent-light hover:bg-white/[0.06] transition-all duration-200 hover:scale-105 active:scale-95"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
          <div className={`p-2 ${sidebarCollapsed ? 'px-1.5' : 'p-3'}`}>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.2em] px-2 mb-3">
                Modules
              </p>
            )}
            {MODULES.map((mod, i) => {
              const Icon = mod.icon
              const active = currentModule === mod.id
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setModule(mod.id)}
                  disabled={running}
                  title={`${mod.label} · ${mod.ps}`}
                  className={`
                    w-full flex items-center gap-3 rounded-xl mb-1.5 text-left
                    transition-all duration-300 ease-out group disabled:opacity-45 disabled:cursor-not-allowed
                    animate-fade-in-up border
                    ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
                    ${active
                      ? 'bg-accent/18 border-accent/40 shadow-glow-sm -translate-y-0.5'
                      : 'bg-white/[0.02] border-transparent hover:bg-white/[0.06] hover:border-white/[0.08] hover:-translate-y-0.5 hover:shadow-md'
                    }`}
                  style={{ animationDelay: `${80 + i * 55}ms`, animationFillMode: 'backwards' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ background: mod.color + '22', border: `1px solid ${mod.color}55` }}
                  >
                    <Icon size={14} style={{ color: mod.color }} />
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold truncate ${active ? 'text-accent-light' : 'text-text-primary'}`}>
                          {mod.label}
                        </p>
                        <p className="text-[10px] text-text-muted truncate">{mod.ps} · {mod.desc}</p>
                      </div>
                      {active && (
                        <ChevronRight
                          size={14}
                          className="text-accent-light flex-shrink-0 animate-slide-in-right"
                        />
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </div>

          <div className={`p-2 mt-auto border-t border-white/[0.06] ${sidebarCollapsed ? 'px-1.5' : 'p-3'}`}>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.2em] px-2 mb-2">
                Integrations
              </p>
            )}
            {INTEGRATIONS.map((int, i) => (
              <button
                key={int.id}
                type="button"
                title={`Ping ${int.label}`}
                onClick={() => pingIntegration(int)}
                className={`w-full flex items-center gap-2 rounded-lg transition-all duration-200 animate-fade-in-up
                  hover:bg-white/[0.06] active:scale-[0.98] border border-transparent hover:border-white/[0.08]
                  ${sidebarCollapsed ? 'justify-center py-2' : 'px-2 py-2'}`}
                style={{ animationDelay: `${420 + i * 40}ms`, animationFillMode: 'backwards' }}
              >
                {int.online
                  ? <Wifi size={12} className="text-success flex-shrink-0" />
                  : <WifiOff size={12} className="text-error flex-shrink-0" />
                }
                {!sidebarCollapsed && (
                  <>
                    <span className="text-xs text-text-muted truncate">{int.label}</span>
                    <span className={`ml-auto text-[10px] font-mono ${int.online ? 'text-success' : 'text-error'}`}>
                      {int.online ? 'online' : 'offline'}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>

          <div className="p-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="group btn-ghost w-full flex items-center justify-center gap-2 text-xs font-medium rounded-xl"
              title="Workspace settings"
            >
              <Settings size={14} className="transition-transform duration-500 group-hover:rotate-90 group-hover:text-accent-light" />
              {!sidebarCollapsed && 'Settings'}
            </button>
          </div>
        </aside>

        <main className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
          <div className="flex items-center gap-4 px-5 pt-5 pb-3 flex-shrink-0 flex-wrap">
            <div
              className="flex items-center gap-2.5 animate-fade-in-up min-w-0"
              style={{ animationDelay: '120ms', animationFillMode: 'backwards' }}
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/15 border border-accent/25 animate-soft-pulse">
                <BarChart2 size={16} className="text-accent-light" />
              </span>
              <div>
                <span className="text-sm font-semibold text-text-primary">Workflow Graph</span>
                <span className="ml-2 text-xs text-text-muted">— {currentModule}</span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
              {recentRuns.map((r, i) => (
                <RecentRunChip
                  key={r.id}
                  run={r}
                  delay={180 + i * 70}
                  onReplay={() => {
                    prefillChat(r.input, r.module)
                    showToast(`Loaded sample · ${r.module}`, 'default')
                  }}
                />
              ))}
            </div>
          </div>

          <div
            className="flex-1 min-h-0 flex flex-col px-5 pb-3 animate-fade-in-up"
            style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
          >
            <div className="flex-1 min-h-0 flex flex-col">
              <DAGView
                ref={dagRef}
                gfxQuality={gfxQuality}
                orbitMode={orbitMode}
                onOrbitModeChange={setOrbitMode}
              />
            </div>
          </div>

          <div className="px-5 pb-4 flex-shrink-0 animate-fade-in-up" style={{ animationDelay: '240ms', animationFillMode: 'backwards' }}>
            <ChatBox />
          </div>
        </main>

        <aside className="w-72 flex-shrink-0 flex flex-col border-l border-white/[0.06] glass-sidebar overflow-hidden">
          <div
            className="flex-1 p-4 overflow-y-auto animate-fade-in-up"
            style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}
          >
            <ExecutionLog />
          </div>
        </aside>
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onPingAll={pingAllIntegrations}
        reducedMotionSystem={reducedMotionSystem}
      />
    </div>
  )
}

function StatPill({ icon: Icon, label, value, delay = 0, onCopy }) {
  return (
    <button
      type="button"
      onClick={onCopy}
      title="Copy metric"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border border-white/[0.08]
        bg-white/[0.04] backdrop-blur-sm text-text-muted transition-all duration-300
        hover:border-accent/35 hover:bg-accent/10 hover:text-text-primary hover:-translate-y-0.5 hover:shadow-glow-sm
        animate-fade-in-up active:scale-95 cursor-pointer"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <Icon size={13} className="text-accent-light flex-shrink-0" />
      <span>{label}:</span>
      <span className="font-semibold text-text-primary font-mono">{value}</span>
    </button>
  )
}

function RecentRunChip({ run, delay = 0, onReplay }) {
  return (
    <button
      type="button"
      onClick={onReplay}
      title="Load sample prompt"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-surface/70
        backdrop-blur-md text-xs transition-all duration-300 hover:border-success/40
        hover:shadow-[0_0_20px_-4px_rgba(52,211,153,0.35)] hover:-translate-y-0.5 animate-fade-in-up active:scale-95"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(52,211,153,0.7)] flex-shrink-0" />
      <span className="text-text-muted">{run.module}</span>
      <span className="text-text-muted font-mono">{run.time}</span>
    </button>
  )
}
