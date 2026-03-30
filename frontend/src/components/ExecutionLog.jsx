import React, { useContext, useRef, useEffect, useState } from 'react'
import { AppContext } from '../App.jsx'
import useExecutionState from '../hooks/useExecutionState.js'
import { Copy, Pin, PinOff, Check, X } from 'lucide-react'

// CSS required for the animations - we inject this inline for simplicity or assume it exists in index.css
const TIMELINE_STYLE = `
  .tl-slide-in {
    animation: tl-slide 0.3s ease-out forwards;
  }
  @keyframes tl-slide {
    from { transform: translateY(8px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .tl-pulse-dot {
    animation: tl-pulse 1s infinite;
  }
  @keyframes tl-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); box-shadow: 0 0 14px rgba(245,158,11,0.8); }
    100% { transform: scale(1); }
  }
  .tl-spin {
    animation: spin 0.8s linear infinite;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-none {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`

const TOOL_THEMES = {
  github: { label: 'GitHub', bg: '#0D1117', color: '#F9FAFB', text: 'GH' },
  jira: { label: 'Jira', bg: '#0A1929', color: '#2684FF', text: 'JR' },
  slack: { label: 'Slack', bg: '#1A0E2E', color: '#E01E5A', text: 'SL' },
  sheets: { label: 'Sheets', bg: '#0A1F0A', color: '#34A853', text: 'SH' }
}

export default function ExecutionLog() {
  const { agentState, showToast } = useContext(AppContext)
  const { dagNodes, thinkingBuffer = '', thinkingDone = false } = agentState
  
  const execution = useExecutionState()
  const { steps, toolStatuses, activeTab, isRunning, totalElapsedMs, dagMeta, setActiveTab } = execution

  const bottomRef = useRef(null)
  const thinkingRef = useRef(null)
  
  const [followScroll, setFollowScroll] = useState(true)
  const [typedThinking, setTypedThinking] = useState('')
  const [reasoningOpen, setReasoningOpen] = useState(true)

  useEffect(() => {
    if (!followScroll) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [steps.length, followScroll])

  useEffect(() => {
    if (thinkingDone) {
      setTypedThinking(thinkingBuffer)
      return undefined
    }
    if (!thinkingBuffer || typedThinking.length >= thinkingBuffer.length) return undefined
    const timer = window.setInterval(() => {
      setTypedThinking((prev) => {
        if (prev.length >= thinkingBuffer.length) return prev
        return thinkingBuffer.slice(0, prev.length + 1)
      })
    }, 18)
    return () => window.clearInterval(timer)
  }, [thinkingBuffer, typedThinking.length, thinkingDone])

  useEffect(() => {
    thinkingRef.current?.scrollTo({ top: thinkingRef.current.scrollHeight, behavior: 'auto' })
  }, [typedThinking])

  const copyLogs = async () => {
    if (!steps.length) {
      showToast('Nothing to copy yet', 'warning')
      return
    }
    const text = steps.map((l) => `[${l.status}] ${l.title}${l.subtitle ? ` — ${l.subtitle}` : ''}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      showToast(`Copied ${steps.length} entries`, 'success')
    } catch {
      showToast('Clipboard unavailable', 'warning')
    }
  }

  const hasThinking = thinkingBuffer.length > 0 || typedThinking.length > 0
  const isEmpty = steps.length === 0 && !isRunning && !dagMeta.sessionId

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <style>{TIMELINE_STYLE}</style>
      
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 gap-2 flex-wrap mb-4">
        <h3 className="text-sm font-bold text-text-primary tracking-tight">Execution Log</h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFollowScroll(!followScroll)}
            className={`rounded-lg p-1.5 transition-all duration-200 border
              ${followScroll
                ? 'border-accent/35 bg-accent/10 text-accent-light hover:shadow-glow-sm'
                : 'border-white/[0.08] text-text-muted hover:text-text-primary hover:bg-white/[0.06]'
              }`}
          >
            {followScroll ? <Pin size={14} /> : <PinOff size={14} />}
          </button>
          <button
            type="button"
            onClick={copyLogs}
            disabled={!steps.length}
            className="rounded-lg p-1.5 border border-white/[0.08] text-text-muted hover:text-accent-light hover:border-accent/35 hover:bg-accent/10 transition-all duration-200 disabled:opacity-40"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full border-b border-[#1E1B2E] flex mb-2 flex-shrink-0">
        <button
          onClick={() => setActiveTab('steps')}
          className={`flex-1 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
            activeTab === 'steps' ? 'text-white border-b-[#7C3AED]' : 'text-[#6B7280] border-b-transparent hover:text-[#A78BFA]'
          }`}
        >
          Agent Steps
        </button>
        <button
          onClick={() => setActiveTab('outputs')}
          className={`flex-1 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
            activeTab === 'outputs' ? 'text-white border-b-[#7C3AED]' : 'text-[#6B7280] border-b-transparent hover:text-[#A78BFA]'
          }`}
        >
          Tool Outputs
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-4 flex flex-col relative min-h-0">
        
        {/* Empty State */}
        {isEmpty && activeTab === 'steps' && (
          <div className="flex flex-col items-center justify-center flex-1 h-full opacity-60 tl-slide-in">
            <div className="w-3 h-3 bg-[#7C3AED] rounded-full animate-pulse shadow-[0_0_12px_rgba(124,58,237,0.5)] mb-3"></div>
            <p className="text-xs text-[#6B7280]">Waiting for agent...</p>
          </div>
        )}

        {/* --- TAB 1: AGENT STEPS (TIMELINE RIVER) --- */}
        {activeTab === 'steps' && !isEmpty && (
          <div className="flex flex-col flex-1 pl-1">
            {/* Reasoning Strip */}
            {hasThinking && (
              <div className="rounded-xl border border-white/[0.08] bg-[#0b0a12]/60 mb-4 flex-shrink-0 tl-slide-in">
                <button type="button" onClick={() => setReasoningOpen(!reasoningOpen)} className="w-full flex justify-between px-3 py-2.5">
                  <div className="text-left">
                    <p className="text-[11px] font-medium text-[#7C3AED] uppercase">Agent reasoning</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">Live stream · {typedThinking.length} chars</p>
                  </div>
                  <span className="text-[11px] text-[#6B7280]">{reasoningOpen ? 'Hide' : 'Show'}</span>
                </button>
                {reasoningOpen && (
                  <div ref={thinkingRef} className="bg-[#0D0D0D] rounded-b-xl px-3 py-3 font-mono text-[11px] text-[#A78BFA] max-h-[140px] overflow-y-auto">
                    {typedThinking}{!thinkingDone && '|'}
                  </div>
                )}
              </div>
            )}

            {/* Sub-River: DAG Generated */}
            <div className="flex tl-slide-in mb-0 relative group">
              <div className="w-[20px] shrink-0 flex flex-col items-center">
                <div className="w-2.5 h-2.5 bg-[#7C3AED] transform rotate-45 z-10 mt-1 shadow-[0_0_8px_rgba(124,58,237,0.5)]"></div>
                {steps.length > 0 && <div className="w-[2px] min-h-[16px] flex-1 bg-[#10B981]"></div>}
              </div>
              <div className="flex-1 pb-4 pl-3">
                <p className="text-[12px] font-medium text-[#A78BFA]">DAG generated</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">{dagMeta.totalSteps} steps planned</p>
              </div>
            </div>

            {/* Step River */}
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1
              const nextStatus = isLast ? 'none' : steps[idx + 1].status
              const isFinalDone = step.status === 'done_final'
              
              // Determine line segment style exactly per spec
              let lineStyle = { background: '#1E1B2E' }
              if (step.status === 'done' || step.status === 'done_final') {
                if (nextStatus === 'running' || nextStatus === 'pending') { // connecting DONE to RUNNING
                  lineStyle = { background: 'linear-gradient(to bottom, #10B981, #7C3AED)' }
                } else if (nextStatus === 'done' || nextStatus === 'done_final') {
                  lineStyle = { background: '#10B981' }
                }
              }

              // Overrides for final step
              if (isFinalDone) {
                return (
                  <div key={step.id || 'final'} className="flex tl-slide-in relative group">
                    <div className="w-[20px] shrink-0 flex flex-col items-center">
                      <div className="w-[14px] h-[14px] rounded-full bg-[#10B981] z-10 mt-1 shadow-[0_0_16px_rgba(16,185,129,0.5)]"></div>
                    </div>
                    <div className="flex-1 pb-4 pl-3">
                      <p className="text-[12px] font-semibold text-[#10B981]">{step.title}</p>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{step.subtitle}</p>
                    </div>
                  </div>
                )
              }

              let dotClass = ""
              let titleColor = ""
              if (step.status === 'done') {
                dotClass = "w-3 h-3 rounded-full bg-[#10B981]"
                titleColor = "text-[#F9FAFB]"
              } else if (step.status === 'running') {
                dotClass = "w-3 h-3 rounded-full bg-[#F59E0B] tl-pulse-dot shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                titleColor = "text-[#F59E0B]"
              } else if (step.status === 'failed') {
                dotClass = "w-3 h-3 rounded-full bg-[#EF4444]"
                titleColor = "text-[#EF4444]"
              } else {
                dotClass = "w-3 h-3 rounded-full border-[1.5px] border-[#374151] bg-transparent"
                titleColor = "text-[#374151]"
              }

              return (
                <div key={step.id} className="flex tl-slide-in relative group">
                  <div className="w-[20px] shrink-0 flex flex-col items-center">
                    <div className={`${dotClass} z-10 mt-1`}></div>
                    {!isLast && <div className="w-[2px] flex-1 min-h-[20px] -mt-1" style={lineStyle}></div>}
                  </div>
                  <div className="flex-1 pb-4 pl-3">
                    <p className={`text-[12px] font-medium ${titleColor}`}>{step.title}</p>
                    <p className="text-[10px] text-[#6B7280] mt-0.5 leading-tight pr-2 break-words">
                      {step.subtitle}
                      {step.status === 'done' && step.elapsedMs > 0 && (
                        <span className="font-mono text-[9px] text-[#A78BFA] ml-2">{step.elapsedMs / 1000}s</span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}

        {/* --- TAB 2: TOOL OUTPUTS --- */}
        {activeTab === 'outputs' && (
          <div className="flex-1 flex flex-col pt-1">
            {Object.keys(TOOL_THEMES).map((toolKey) => {
              // Only render tools actively requested/used in DAG or already in toolStatuses
              // Based on prompt: Tools used in this run's DAG 
              const inDag = dagNodes.some(n => n.data.tool === toolKey) || toolStatuses[toolKey]
              if (!inDag) return null

              const t = TOOL_THEMES[toolKey]
              const stat = toolStatuses[toolKey] || 'pending'
              let leftBorder = 'transparent'
              if (stat === 'done') leftBorder = 'rgba(16,185,129,0.3)'
              else if (stat === 'running') leftBorder = 'rgba(245,158,11,0.4)'

              return (
                <div key={toolKey} className="relative flex items-center gap-2.5 h-[48px] px-1 border-b border-[#111] tl-slide-in" style={{ borderLeft: `2px solid ${leftBorder}` }}>
                  {/* Progress flourish for DONE */}
                  {stat === 'done' && <div className="absolute bottom-[-1px] left-0 h-[2px] bg-[#10B981] rounded-[1px] w-full"></div>}
                  
                  <div className="w-[28px] h-[28px] shrink-0 rounded-[7px] flex items-center justify-center font-bold text-[10px]" style={{ background: t.bg, color: t.color }}>
                    {t.text}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <p className="text-[12px] font-medium text-[#F9FAFB] leading-tight truncate">{t.label}</p>
                    <p className={`text-[10px] leading-tight truncate ${
                      stat === 'done' ? 'text-[#6B7280]' : 
                      stat === 'running' ? 'text-[#F59E0B]' : 
                      stat === 'failed' ? 'text-[#EF4444]' : 'text-[#374151]'
                    }`}>
                      {stat === 'done' ? `Result updated` : stat === 'running' ? 'Processing...' : stat === 'failed' ? 'Error executing' : 'Waiting for execution...'}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center justify-end w-6">
                    {stat === 'done' && <Check size={14} className="text-[#10B981]" />}
                    {stat === 'running' && <div className="w-[14px] h-[14px] rounded-full border-2 border-transparent border-t-[#F59E0B] tl-spin"></div>}
                    {stat === 'failed' && <X size={14} className="text-[#EF4444]" />}
                    {stat === 'pending' && <span className="text-[#374151] font-bold">—</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* --- Pinned Tool Strip (Only active in Agent Steps) --- */}
      {activeTab === 'steps' && !isEmpty && (
        <div className="flex-shrink-0 mt-auto pt-2 bg-[#0D0D0D]">
          <div className="h-[1px] bg-[#1E1B2E] w-full mb-2"></div>
          <p className="text-[9px] font-bold tracking-[0.1em] text-[#6B7280] mb-1.5 uppercase">Tools</p>
          <div className="flex gap-1.5 flex-wrap">
            {Object.keys(TOOL_THEMES).map(toolKey => {
              const inDag = dagNodes.some(n => n.data.tool === toolKey) || toolStatuses[toolKey]
              if (!inDag) return null
              
              const lbl = TOOL_THEMES[toolKey].label
              const st = toolStatuses[toolKey] || 'pending'
              let pStyle = "bg-[#111] border-[#1E1B2E] text-[#374151]"
              let content = lbl

              if (st === 'running') {
                pStyle = "bg-[#1A1400] border-[#F59E0B]/50 text-[#F59E0B]"
              } else if (st === 'done') {
                pStyle = "bg-[#0A1A0A] border-[#10B981]/50 text-[#10B981]"
                content = `${lbl} ✓`
              } else if (st === 'failed') {
                pStyle = "bg-[#1A0A0A] border-[#EF4444]/50 text-[#EF4444]"
                content = `${lbl} ✗`
              }

              return (
                <span key={toolKey} className={`rounded-md px-2 py-1 text-[9px] font-bold flex items-center gap-1 border ${pStyle} transition-colors`}>
                  {content}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
