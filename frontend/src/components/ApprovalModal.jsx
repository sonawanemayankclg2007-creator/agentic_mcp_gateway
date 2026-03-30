import React, { useState, useEffect, useRef, useMemo } from 'react'

const TIMEOUT_SECONDS = 60
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function ApprovalModal({
  isOpen,
  action,
  tool,
  description,
  outcome,
  onApprove,
  onReject,
}) {
  const [countdown, setCountdown] = useState(TIMEOUT_SECONDS)
  const cardRef = useRef(null)
  const approveRef = useRef(null)

  const normalizedTool = useMemo(
    () => (tool || '').trim().toUpperCase() || 'TOOL',
    [tool]
  )

  useEffect(() => {
    if (!isOpen) return
    setCountdown(TIMEOUT_SECONDS)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined
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
  }, [isOpen, onReject])

  useEffect(() => {
    if (!isOpen) return undefined
    const focusTimer = window.setTimeout(() => approveRef.current?.focus(), 0)
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onReject()
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        onApprove()
        return
      }
      if (event.key !== 'Tab' || !cardRef.current) return

      const focusable = Array.from(cardRef.current.querySelectorAll(FOCUSABLE))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onApprove, onReject])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.75)] backdrop-blur-[4px]" aria-hidden />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-modal-title"
        className="relative w-[90%] max-w-[480px] rounded-2xl border bg-[#1E1B2E] p-8 animate-scale-in"
        style={{ borderColor: '#7C3AED' }}
      >
        <div className="mx-auto mb-4 h-5 w-5 rounded-full bg-[#F59E0B] animate-pulse shadow-[0_0_16px_rgba(245,158,11,0.55)]" />
        <h2 id="approval-modal-title" className="mb-2 text-center text-[20px] font-semibold text-white">
          Approval Required
        </h2>
        <p className="mb-4 text-center text-[14px] text-[#9CA3AF]">
          The agent wants to perform the following action:
        </p>

        <div className="rounded-xl bg-[#0D0D0D] p-4">
          <span className="inline-flex rounded px-2 py-[2px] text-[11px] font-bold bg-[#4C1D95] text-[#A78BFA]">
            {normalizedTool}
          </span>
          <p className="mt-2 text-[15px] font-medium text-white">
            {action || description || 'No action description provided'}
          </p>
          <p className="mt-1 text-[13px] text-[#9CA3AF]">
            {outcome || 'No expected outcome provided'}
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 rounded-[10px] border px-7 py-3 text-[14px] font-medium text-[#9CA3AF] transition-all duration-200 hover:text-[#EF4444] hover:border-[#EF4444]"
            style={{ borderColor: '#374151', background: 'transparent' }}
          >
            Reject
          </button>
          <button
            ref={approveRef}
            type="button"
            onClick={onApprove}
            className="flex-1 rounded-[10px] px-7 py-3 text-[14px] font-medium text-white transition-all duration-200"
            style={{ background: '#7C3AED' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#6D28D9'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(124,58,237,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#7C3AED'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Approve
          </button>
        </div>

        <div className={`mt-3 text-center text-[12px] ${countdown <= 10 ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
          Auto-rejecting in {countdown}s
        </div>
      </div>
    </div>
  )
}
