import { useState, useEffect, useContext, useRef } from 'react'
import { AppContext } from '../App.jsx'

export default function useExecutionState() {
  const { agentState } = useContext(AppContext)
  const { lastEvent, dagNodes, running, workflowId, currentModule } = agentState

  const [steps, setSteps] = useState([])
  const [toolStatuses, setToolStatuses] = useState({})
  const [activeTab, setActiveTab] = useState('steps')
  const [manualTabOverride, setManualTabOverride] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [totalElapsedMs, setTotalElapsedMs] = useState(0)
  const [dagMeta, setDagMeta] = useState({ totalSteps: 0, sessionId: null, module: '' })

  const runStartRef = useRef(0)
  const timerRef = useRef(null)
  const autoSwitchTimerRef = useRef(null)

  // Track run state and elapsed time
  useEffect(() => {
    if (running && !isRunning) {
      // New run started
      setIsRunning(true)
      setTotalElapsedMs(0)
      setSteps([])
      setToolStatuses({})
      setManualTabOverride(false)
      setActiveTab('steps')
      runStartRef.current = performance.now()
      
      timerRef.current = window.setInterval(() => {
        setTotalElapsedMs(Math.round(performance.now() - runStartRef.current))
      }, 100)

      setDagMeta({ totalSteps: dagNodes.length, sessionId: workflowId, module: currentModule })
      
      // Initialize steps from dagNodes
      if (dagNodes && dagNodes.length > 0) {
        setSteps(dagNodes.map(n => ({
          id: n.id,
          title: n.data.label,
          subtitle: 'Waiting...',
          tool: n.data.tool,
          status: 'pending',
          result: '',
          elapsedMs: 0
        })))
      }
    } else if (!running && isRunning) {
      setIsRunning(false)
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [running, dagNodes, workflowId, currentModule, isRunning])

  useEffect(() => {
    if (!lastEvent || !isRunning) return

    const { type, node_id, step, detail, tool, status, result, error, summary } = lastEvent

    if (type === 'step_start') {
      if (!manualTabOverride) setActiveTab('steps')
      setSteps(prev => {
        const idx = prev.findIndex(p => p.id === node_id)
        if (idx === -1) {
           return [...prev, { id: node_id, title: step, subtitle: detail, tool: tool, status: 'running', result: '', elapsedMs: 0 }]
        }
        const next = [...prev]
        next[idx] = { ...next[idx], status: 'running', subtitle: detail }
        return next
      })
    } else if (type === 'step_done') {
      if (!manualTabOverride) setActiveTab('steps')
      setSteps(prev => {
        const idx = prev.findIndex(p => p.id === node_id)
        if (idx === -1) return prev
        const next = [...prev]
        // Estimate elapsed roughly via total elapsed 
        // Real implementation might track step start times, but this is a mockup hook
        next[idx] = { ...next[idx], status: 'done', subtitle: detail, result: detail, elapsedMs: totalElapsedMs }
        return next
      })
    } else if (type === 'step_failed') {
      setSteps(prev => {
        const idx = prev.findIndex(p => p.id === node_id)
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = { ...next[idx], status: 'failed', subtitle: detail, result: detail }
        return next
      })
    } else if (type === 'tool_update') {
      if (tool) {
        setToolStatuses(prev => ({ ...prev, [tool.toLowerCase()]: status || 'running' }))
      }
    } else if (type === 'tool_done') {
      const tid = (tool || '').toLowerCase()
      if (tid) {
        setToolStatuses(prev => ({ ...prev, [tid]: status === 'failed' ? 'failed' : 'done' }))
        
        if (!manualTabOverride) {
          setActiveTab('outputs')
          if (autoSwitchTimerRef.current) window.clearTimeout(autoSwitchTimerRef.current)
          autoSwitchTimerRef.current = window.setTimeout(() => {
            setActiveTab('steps')
          }, 1500)
        }
      }
    } else if (type === 'done') {
      setIsRunning(false)
      if (timerRef.current) window.clearInterval(timerRef.current)
      setSteps(prev => [
        ...prev, 
        { 
          id: 'final_complete', 
          title: 'All steps complete', 
          subtitle: `Results dispatched · ${totalElapsedMs}ms total`, 
          tool: null, 
          status: 'done_final', 
          result: summary, 
          elapsedMs: 0 
        }
      ])
    }
  }, [lastEvent, manualTabOverride])

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (autoSwitchTimerRef.current) window.clearTimeout(autoSwitchTimerRef.current)
    }
  }, [])

  return {
    steps,
    toolStatuses,
    activeTab,
    isRunning,
    totalElapsedMs,
    dagMeta,
    setActiveTab: (tab) => {
      setManualTabOverride(true)
      setActiveTab(tab)
      if (autoSwitchTimerRef.current) window.clearTimeout(autoSwitchTimerRef.current)
    }
  }
}
