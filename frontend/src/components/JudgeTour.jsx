import React, { useEffect, useMemo, useState } from 'react'

const STEPS = [
  {
    target: '[data-tour="sidebar-modules"]',
    title: 'Module rail',
    text: 'This left rail changes the business scenario. Each module keeps the same autonomous flow but with domain-specific prompts.',
  },
  {
    target: '[data-tour="workflow-canvas"]',
    title: 'Live workflow canvas',
    text: 'The center canvas visualizes planning and execution as a DAG. Nodes update as each tool runs and completes.',
  },
  {
    target: '[data-tour="module-selector"]',
    title: 'Scenario selector',
    text: 'Pick the exact context before running. Placeholder text and quick actions adapt to this choice.',
  },
  {
    target: '[data-tour="input-box"]',
    title: 'Problem input',
    text: 'Paste a bug, cost narrative, pricing signal, role brief, or location criteria. The agent converts it into executable steps.',
  },
  {
    target: '[data-tour="run-agent"]',
    title: 'Run agent',
    text: 'Start autonomous execution. Use Cmd/Ctrl + Enter for fast submit during demos.',
  },
  {
    target: '[data-tour="auto-heal-entry"]',
    title: 'Auto-healer access',
    text: 'Click Auto-Heal in the top bar to jump directly to the Settings drawer and open the healer section.',
  },
  {
    target: '[data-tour="auto-heal-panel"]',
    title: 'How to use auto-healer',
    text: 'Add a bug description (required), then optional repo and file path. Click Auto-heal bug to get step-by-step diagnosis and a proposed patch.',
  },
  {
    target: '[data-tour="right-panel"]',
    title: 'Execution intelligence',
    text: 'This panel streams reasoning, step status, and final tool results so judges can audit every action.',
  },
  {
    target: '[data-tour="steps-tab"]',
    title: 'Agent Steps tab',
    text: 'Shows reasoning + step-by-step progress in real time, including live typewriter thinking.',
  },
  {
    target: '[data-tour="tools-tab"]',
    title: 'Tool Outputs tab',
    text: 'Shows GitHub, Jira, Slack, and Sheets outputs with result summaries and status states.',
  },
]

export default function JudgeTour({ isOpen, onClose }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(null)
  const [placement, setPlacement] = useState('bottom')

  const step = useMemo(() => STEPS[index], [index])

  useEffect(() => {
    if (!isOpen) return
    setIndex(0)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined
    const updateRect = () => {
      const el = document.querySelector(step.target)
      if (!el) {
        setRect(null)
        return
      }
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
      const nextRect = el.getBoundingClientRect()
      setRect(nextRect)

      const vh = window.innerHeight
      const vw = window.innerWidth
      const space = {
        top: nextRect.top,
        bottom: vh - nextRect.bottom,
        left: nextRect.left,
        right: vw - nextRect.right,
      }
      const order = ['right', 'left', 'bottom', 'top']
      const best = order.sort((a, b) => space[b] - space[a])[0]
      setPlacement(best)
    }
    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [isOpen, step])

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') {
        if (index < STEPS.length - 1) setIndex((v) => v + 1)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, index, onClose])

  if (!isOpen) return null

  const cardW = 340
  const cardH = 220
  const gap = 14
  const margin = 16

  let top = window.innerHeight / 2 - cardH / 2
  let left = window.innerWidth / 2 - cardW / 2

  if (rect) {
    if (placement === 'right') {
      top = rect.top + rect.height / 2 - cardH / 2
      left = rect.right + gap
    } else if (placement === 'left') {
      top = rect.top + rect.height / 2 - cardH / 2
      left = rect.left - cardW - gap
    } else if (placement === 'top') {
      top = rect.top - cardH - gap
      left = rect.left + rect.width / 2 - cardW / 2
    } else {
      top = rect.bottom + gap
      left = rect.left + rect.width / 2 - cardW / 2
    }
  }

  top = Math.max(margin, Math.min(window.innerHeight - cardH - margin, top))
  left = Math.max(margin, Math.min(window.innerWidth - cardW - margin, left))

  return (
    <div className="fixed inset-0 z-[10020]">
      {rect ? (
        <>
          <div
            className="absolute bg-black/70 backdrop-blur-[2px]"
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - 8) }}
          />
          <div
            className="absolute bg-black/70 backdrop-blur-[2px]"
            style={{ top: Math.min(window.innerHeight, rect.bottom + 8), left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="absolute bg-black/70 backdrop-blur-[2px]"
            style={{
              top: Math.max(0, rect.top - 8),
              left: 0,
              width: Math.max(0, rect.left - 8),
              height: Math.min(window.innerHeight, rect.height + 16),
            }}
          />
          <div
            className="absolute bg-black/70 backdrop-blur-[2px]"
            style={{
              top: Math.max(0, rect.top - 8),
              left: Math.min(window.innerWidth, rect.right + 8),
              right: 0,
              height: Math.min(window.innerHeight, rect.height + 16),
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      )}

      {rect && (
        <div
          className="absolute rounded-xl border-2 border-[#8B5CF6] shadow-[0_0_40px_rgba(139,92,246,0.55)] pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}

      <div
        className="absolute w-[340px] rounded-2xl border border-white/[0.12] bg-[#171327]/95 backdrop-blur-xl p-4 shadow-panel"
        style={{ top, left }}
      >
        {rect && (
          <span
            className="absolute h-3 w-3 rotate-45 bg-[#171327] border border-white/[0.12]"
            style={
              placement === 'right'
                ? { left: -7, top: '50%', marginTop: -6, borderTop: 'none', borderRight: 'none' }
                : placement === 'left'
                  ? { right: -7, top: '50%', marginTop: -6, borderBottom: 'none', borderLeft: 'none' }
                  : placement === 'top'
                    ? { bottom: -7, left: '50%', marginLeft: -6, borderTop: 'none', borderLeft: 'none' }
                    : { top: -7, left: '50%', marginLeft: -6, borderBottom: 'none', borderRight: 'none' }
            }
          />
        )}
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#A78BFA] mb-1">Quick tour</p>
        <h3 className="text-white text-[16px] font-semibold">{step.title}</h3>
        <p className="mt-1.5 text-[13px] text-[#C4C4CE] leading-relaxed">{step.text}</p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] text-[#8C8CA0]">{index + 1} / {STEPS.length}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndex((v) => Math.max(0, v - 1))}
              disabled={index === 0}
              className="px-3 py-1.5 rounded-lg border border-white/[0.14] text-[#A1A1B3] text-[12px] hover:text-white hover:border-white/[0.3] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-white/[0.14] text-[#A1A1B3] text-[12px] hover:text-white hover:border-white/[0.3]"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => {
                if (index < STEPS.length - 1) setIndex((v) => v + 1)
                else onClose()
              }}
              className="px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white text-[12px] hover:bg-[#6D28D9]"
            >
              {index < STEPS.length - 1 ? 'Next' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
