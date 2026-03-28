import React, { useState, useCallback } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import ApprovalModal from './components/ApprovalModal.jsx'

export const AppContext = React.createContext(null)

export default function App() {
  const [agentState, setAgentState] = useState({
    running: false,
    workflowId: null,
    dagNodes: [],
    dagEdges: [],
    logs: [],
    currentModule: 'DevOps',
    stats: { handled: 24, avgTime: 8, integrations: 4 },
    workflowOutput: null,
    lastRunInput: '',
  })

  const [approval, setApproval] = useState(null)

  const [toast, setToast] = useState(null)
  const [chatPrefill, setChatPrefill] = useState(null)

  const showToast = useCallback((message, tone = 'default') => {
    const id = Date.now()
    setToast({ id, message, tone })
    window.setTimeout(() => {
      setToast((t) => (t?.id === id ? null : t))
    }, 2800)
  }, [])

  const prefillChat = useCallback((text, module) => {
    setChatPrefill({ id: Date.now(), text, module })
  }, [])

  const clearChatPrefill = useCallback(() => {
    setChatPrefill(null)
  }, [])

  const updateDagNode = useCallback((nodeId, status) => {
    setAgentState((prev) => ({
      ...prev,
      dagNodes: prev.dagNodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status } } : n
      ),
    }))
  }, [])

  const appendLog = useCallback((entry) => {
    setAgentState((prev) => ({
      ...prev,
      logs: [...prev.logs, { id: Date.now() + Math.random(), ...entry }],
    }))
  }, [])

  const requestApproval = useCallback((data) => {
    setApproval(data)
  }, [])

  const resolveApproval = useCallback(
    (approved) => {
      if (approval?.onResolve) approval.onResolve(approved)
      setApproval(null)
    },
    [approval]
  )

  const toastStyles = {
    default: 'border-white/15 bg-surface/95 text-text-primary',
    success: 'border-success/40 bg-emerald-950/90 text-success',
    warning: 'border-warning/45 bg-amber-950/85 text-warning',
    error: 'border-error/40 bg-red-950/90 text-error',
  }

  return (
    <AppContext.Provider
      value={{
        agentState,
        setAgentState,
        updateDagNode,
        appendLog,
        requestApproval,
        showToast,
        prefillChat,
        chatPrefill,
        clearChatPrefill,
      }}
    >
      <div className="h-screen flex flex-col overflow-hidden bg-bg">
        <Dashboard />
        {approval && (
          <ApprovalModal
            data={approval}
            onApprove={() => resolveApproval(true)}
            onReject={() => resolveApproval(false)}
          />
        )}
        {toast && (
          <div
            role="status"
            className={`fixed bottom-6 left-1/2 z-[200] max-w-md -translate-x-1/2 px-4 py-2.5 rounded-xl border
              backdrop-blur-xl shadow-panel text-sm font-medium animate-fade-in-up ${toastStyles[toast.tone] || toastStyles.default}`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </AppContext.Provider>
  )
}
