import React, { useState, useContext, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Play, ChevronDown, Zap, X, Timer } from 'lucide-react'
import { AppContext } from '../App.jsx'
import { mockRunAgent, mockStreamExecution } from '../services/api.js'
import { MODULE_KEYS, getModuleIO } from '../config/moduleIO.js'

const MAX_LEN = 2000

export default function ChatBox() {
  const {
    agentState,
    setAgentState,
    appendLog,
    updateDagNode,
    chatPrefill,
    clearChatPrefill,
    showToast,
  } = useContext(AppContext)
  const [input, setInput] = useState('')
  const [moduleOpen, setModuleOpen] = useState(false)
  const [shake, setShake] = useState(false)
  const [runBurst, setRunBurst] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [menuStyle, setMenuStyle] = useState(null)
  const moduleBtnRef = useRef(null)

  const { running, currentModule } = agentState
  const io = getModuleIO(currentModule)

  useEffect(() => {
    if (!chatPrefill) return
    setInput(chatPrefill.text)
    if (chatPrefill.module) {
      setAgentState((prev) => ({ ...prev, currentModule: chatPrefill.module }))
    }
    clearChatPrefill()
  }, [chatPrefill, clearChatPrefill, setAgentState])

  useEffect(() => {
    if (!running) {
      setElapsedMs(0)
      return
    }
    const t0 = performance.now()
    const id = window.setInterval(() => setElapsedMs(Math.round(performance.now() - t0)), 100)
    return () => window.clearInterval(id)
  }, [running])

  useEffect(() => {
    const close = (e) => {
      if (e.key === 'Escape') setModuleOpen(false)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  useLayoutEffect(() => {
    if (!moduleOpen) {
      setMenuStyle(null)
      return
    }
    const update = () => {
      const el = moduleBtnRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const margin = 8
      const gap = 8
      let menuWidth = Math.max(192, r.width)
      let left = r.left
      if (left + menuWidth > vw - margin) left = vw - menuWidth - margin
      if (left < margin) left = margin

      const spaceAbove = r.top - margin
      const spaceBelow = vh - r.bottom - margin
      const cap = 320
      /** Prefer the side with more room; flip if the other side fits the menu better. */
      let placeAbove = spaceAbove >= spaceBelow
      let maxH = Math.min(cap, (placeAbove ? spaceAbove : spaceBelow) - gap)
      const minOpen = 120
      if (maxH < minOpen) {
        placeAbove = spaceBelow >= spaceAbove
        maxH = Math.min(cap, (placeAbove ? spaceAbove : spaceBelow) - gap)
      }
      maxH = Math.max(80, maxH)

      const base = { position: 'fixed', left, width: menuWidth, maxHeight: maxH }
      if (placeAbove) {
        setMenuStyle({ ...base, bottom: vh - r.top + gap, top: 'auto' })
      } else {
        setMenuStyle({ ...base, top: r.bottom + gap, bottom: 'auto' })
      }
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [moduleOpen])

  useEffect(() => {
    if (!moduleOpen) return
    const onDown = (e) => {
      const t = e.target
      if (moduleBtnRef.current?.contains(t)) return
      if (t.closest?.('[data-module-menu]')) return
      setModuleOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [moduleOpen])

  const setModule = (m) => {
    setAgentState((prev) => ({ ...prev, currentModule: m }))
    setModuleOpen(false)
  }

  const handleRun = async () => {
    if (!input.trim() || running) return

    setAgentState((prev) => ({
      ...prev,
      running: true,
      logs: [],
      dagNodes: [],
      dagEdges: [],
      workflowOutput: null,
      lastRunInput: '',
    }))

    appendLog({ status: 'running', step: 'Planning workflow', detail: 'Claude is generating the DAG…' })

    try {
      const { workflowId, nodes, edges } = await mockRunAgent({ input, module: currentModule })

      setAgentState((prev) => ({
        ...prev,
        workflowId,
        dagNodes: nodes,
        dagEdges: edges,
      }))

      appendLog({ status: 'done', step: 'DAG generated', detail: `${nodes.length} steps planned` })

      for await (const event of mockStreamExecution(nodes, {
        module: currentModule,
        inputText: input.trim(),
      })) {
        if (event.type === 'step_start') {
          updateDagNode(event.node_id, 'running')
          appendLog({ status: 'running', step: event.step, detail: event.detail })
        } else if (event.type === 'step_done') {
          updateDagNode(event.node_id, 'done')
          appendLog({ status: 'done', step: event.step, detail: event.detail })
        } else if (event.type === 'done') {
          appendLog({ status: 'done', step: '✓ All steps complete', detail: event.summary })
          setAgentState((prev) => ({
            ...prev,
            running: false,
            stats: { ...prev.stats, handled: prev.stats.handled + 1 },
            workflowOutput: event.output ?? null,
            lastRunInput: input.trim().slice(0, MAX_LEN),
          }))
          setRunBurst(true)
          window.setTimeout(() => setRunBurst(false), 600)
          showToast('Workflow complete', 'success')
        }
      }
    } catch (err) {
      appendLog({ status: 'error', step: 'Agent error', detail: err.message })
      setAgentState((prev) => ({ ...prev, running: false }))
      setShake(true)
      window.setTimeout(() => setShake(false), 400)
      showToast(err.message || 'Run failed', 'error')
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleRun()
    }
  }

  const len = input.length
  const nearLimit = len > MAX_LEN * 0.85

  const moduleMenu =
    moduleOpen &&
    menuStyle &&
    createPortal(
      <div
        data-module-menu
        className="rounded-xl border border-white/[0.12] bg-surface/98 backdrop-blur-xl shadow-panel overflow-y-auto overflow-x-hidden animate-scale-in origin-bottom z-[30000]"
        style={menuStyle}
        role="listbox"
      >
        {MODULE_KEYS.map((m, i) => (
          <button
            key={m}
            type="button"
            role="option"
            aria-selected={m === currentModule}
            onClick={() => setModule(m)}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl
              ${m === currentModule
                ? 'bg-accent/20 text-accent-light font-semibold'
                : 'text-text-primary hover:bg-white/[0.08]'
              }`}
            style={{ animationDelay: `${i * 25}ms`, animationFillMode: 'backwards' }}
          >
            {m}
          </button>
        ))}
      </div>,
      document.body
    )

  return (
    <div
      className={`relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-surface/90 to-surface/70
        backdrop-blur-xl p-4 shadow-panel overflow-visible group/shell transition-shadow duration-500
        ${shake ? 'animate-wiggle' : ''} ${runBurst ? 'ring-2 ring-success/50 shadow-[0_0_32px_-8px_rgba(52,211,153,0.35)]' : ''}`}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-focus-within/shell:opacity-100 transition-opacity duration-500 overflow-hidden"
        style={{
          background:
            'radial-gradient(800px 120px at 50% 100%, rgba(139,92,246,0.12), transparent 60%)',
        }}
      />
      <div className="relative flex flex-wrap items-center gap-3">
        <div className="relative flex-shrink-0 z-10">
          <button
            ref={moduleBtnRef}
            type="button"
            aria-expanded={moduleOpen}
            aria-haspopup="listbox"
            onClick={() => setModuleOpen((o) => !o)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-2/90 border border-white/[0.08]
              hover:border-accent/45 hover:shadow-glow-sm text-sm font-medium text-text-primary min-w-[138px]
              transition-all duration-300 active:scale-[0.98]"
          >
            <Zap size={14} className="text-accent-light" />
            {currentModule}
            <ChevronDown
              size={14}
              className={`ml-auto text-text-muted transition-transform duration-300 ${moduleOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {moduleMenu}
        </div>

        <div
          className={`relative flex-1 min-w-[200px] rounded-xl border bg-surface-2/80 transition-all duration-300 ${io.shellClass}`}
        >
          {io.multiline ? (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
              onKeyDown={handleKey}
              disabled={running}
              placeholder={io.placeholder}
              rows={io.minRows ?? 4}
              className={`w-full resize-y min-h-[4.5rem] max-h-48 px-4 py-2.5 pr-10 rounded-xl bg-transparent border-0
                text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:ring-0
                disabled:opacity-50 disabled:cursor-not-allowed ${io.fieldClass}`}
            />
          ) : (
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
              onKeyDown={handleKey}
              disabled={running}
              placeholder={io.placeholder}
              className={`w-full px-4 py-2.5 pr-10 rounded-xl bg-transparent border-0
                text-text-primary text-sm placeholder:text-text-muted/70
                focus:outline-none focus:ring-0
                disabled:opacity-50 disabled:cursor-not-allowed ${io.fieldClass}`}
            />
          )}
          {!!input && !running && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="absolute right-2 top-2 rounded-lg p-1.5 text-text-muted
                hover:text-text-primary hover:bg-white/[0.08] transition-all duration-200 hover:rotate-90 active:scale-90"
              title="Clear"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {running && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-warning tabular-nums px-2 py-1
                rounded-lg bg-warning/10 border border-warning/25 animate-pulse"
            >
              <Timer size={12} />
              {(elapsedMs / 1000).toFixed(1)}s
            </span>
          )}
          <button
            type="button"
            onClick={handleRun}
            disabled={running || !input.trim()}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 flex-shrink-0"
          >
            {running ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" className="transition-transform group-hover/shell:scale-110" />
                Run Agent
              </>
            )}
          </button>
        </div>
      </div>

      {!running && io.quickActions?.length > 0 && (
        <div className="relative mt-3 flex flex-wrap gap-2">
          {io.quickActions.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => setInput(q.value.slice(0, MAX_LEN))}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.03]
                text-text-muted hover:text-text-primary hover:border-white/[0.14] hover:bg-accent/10 transition-all duration-200"
              style={{ borderColor: `${io.accent}33` }}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      {!running && (
        <div className="relative mt-2 flex justify-between items-center gap-2">
          <span className="text-[10px] text-text-muted/80 truncate" title={io.tagline}>
            <span style={{ color: io.accent }} className="font-semibold">
              {io.label}
            </span>
            <span className="mx-1.5 opacity-40">·</span>
            {io.tagline}
          </span>
          <span className={`text-[11px] font-mono tabular-nums flex-shrink-0 ${nearLimit ? 'text-warning' : 'text-text-muted/60'}`}>
            {len}/{MAX_LEN}
          </span>
        </div>
      )}
    </div>
  )
}
