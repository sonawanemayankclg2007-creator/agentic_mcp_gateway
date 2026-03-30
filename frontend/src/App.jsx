import React, { useState, useCallback, useEffect, useRef } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import JudgeTour from './components/JudgeTour.jsx'

export const AppContext = React.createContext(null)

export default function App() {
  const [isBooting, setIsBooting] = useState(true)
  const [showTour, setShowTour] = useState(false)
  const [shouldRenderLoadingScreen, setShouldRenderLoadingScreen] = useState(true)
  const dismissLoadingScreenTimeoutRef = useRef(null)

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

  const [toast, setToast] = useState(null)
  const [chatPrefill, setChatPrefill] = useState(null)
  const [orbitMode, setOrbitMode] = useState(false)

  const handleLoadingComplete = useCallback(() => {
    setIsBooting(false)
    if (dismissLoadingScreenTimeoutRef.current) window.clearTimeout(dismissLoadingScreenTimeoutRef.current)
    dismissLoadingScreenTimeoutRef.current = window.setTimeout(() => {
      setShouldRenderLoadingScreen(false)
    }, 650) // keep mounted during the LoadingScreen 600ms fade-out
  }, [])

  useEffect(() => {
    if (!isBooting) return
    setShouldRenderLoadingScreen(true)
    if (dismissLoadingScreenTimeoutRef.current) window.clearTimeout(dismissLoadingScreenTimeoutRef.current)
  }, [isBooting])

  useEffect(() => {
    if (isBooting) return
    const seen = window.localStorage.getItem('judge-tour-seen') === '1'
    if (!seen) setShowTour(true)
  }, [isBooting])

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

  const requestApproval = useCallback(() => { }, [])

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
        orbitMode,
        setOrbitMode,
        openJudgeTour: () => setShowTour(true),
      }}
    >
      <div className="h-screen flex flex-col overflow-hidden bg-bg">
        <Dashboard />
        {(isBooting || shouldRenderLoadingScreen) && (
          <LoadingScreen onComplete={handleLoadingComplete} minDisplayMs={2200} />
        )}
        <JudgeTour
          isOpen={showTour && !isBooting}
          onClose={() => {
            setShowTour(false)
            window.localStorage.setItem('judge-tour-seen', '1')
          }}
        />
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
