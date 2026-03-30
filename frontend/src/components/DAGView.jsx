import React, {
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
  useLayoutEffect,
} from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeToolbar,
  useReactFlow,
  useNodeId,
  useStore,
  applyNodeChanges,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { AppContext } from '../App.jsx'
import WorkflowSphere from './WorkflowSphere.jsx'
import CanvasErrorBoundary from './CanvasErrorBoundary.jsx'
import ModuleOutputCard from './ModuleOutputCard.jsx'
import { GitBranch, Cpu, Slack, FileSpreadsheet, Globe, Trello } from 'lucide-react'

const TOOL_ICONS = {
  github: GitBranch,
  claude: Cpu,
  slack: Slack,
  sheets: FileSpreadsheet,
  maps: Globe,
  jira: Trello,
}

const STATUS_STYLES = {
  pending: 'border-white/[0.12] bg-surface-2/90 text-text-muted',
  running:
    'border-warning bg-amber-950/40 text-warning shadow-[0_0_20px_-4px_rgba(251,191,36,0.45)] ring-1 ring-warning/30 animate-[pulse_2.2s_ease-in-out_infinite]',
  done:
    'border-success bg-emerald-950/35 text-success shadow-[0_0_18px_-4px_rgba(52,211,153,0.4)]',
  failed: 'border-error bg-red-950/35 text-error shadow-[0_0_18px_-4px_rgba(248,113,113,0.35)]',
}

const STATUS_DOT = {
  pending: 'bg-text-muted',
  running: 'bg-warning animate-pulse',
  done: 'bg-success shadow-[0_0_8px_rgba(52,211,153,0.8)]',
  failed: 'bg-error',
}

function AgentNode({ data, selected }) {
  const nodeId = useNodeId()
  const viewportZoom = useStore((s) => s.transform?.[2] ?? 1)
  const { agentState } = useContext(AppContext)
  const { dagEdges, workflowOutput, running } = agentState
  const isTerminal = !dagEdges.some((e) => e.source === nodeId)
  const showOutputDock = Boolean(workflowOutput && isTerminal && !running)

  const Icon = TOOL_ICONS[data.tool] || Cpu
  const status = data.status || 'pending'
  const flyVisible = true

  return (
    <>
      <NodeToolbar
        isVisible={showOutputDock}
        position={Position.Right}
        offset={28}
        align="start"
        className="!bg-transparent !border-none !shadow-none !p-0"
      >
        <ModuleOutputCard output={workflowOutput} zoom={viewportZoom} />
      </NodeToolbar>
      <div
        className={`rounded-xl border-2 px-4 py-3 min-w-[160px] transition-all duration-500 ease-out cursor-pointer
        hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]
        ${STATUS_STYLES[status]}
        ${selected ? 'ring-2 ring-accent-light ring-offset-2 ring-offset-[#08070f] scale-[1.02]' : ''}
      `}
        style={{
          opacity: 1,
          transform: 'scale(1)',
        }}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent !border-none !w-2.5 !h-2.5 !-left-0.5" />

      <div className="flex items-center gap-2 mb-1">
        <span className={`status-dot relative flex-shrink-0 ${STATUS_DOT[status]}`} />
        <Icon size={13} className="opacity-80 flex-shrink-0" />
        <span className="text-xs font-mono uppercase opacity-65 tracking-wider">{data.tool}</span>
      </div>

      <p className="text-sm font-semibold leading-tight text-text-primary">{data.label}</p>

      <Handle type="source" position={Position.Right} className="!bg-accent !border-none !w-2.5 !h-2.5 !-right-0.5" />
    </div>
    </>
  )
}

const nodeTypes = { agentNode: AgentNode }

function DagFitBridge({ apiRef }) {
  const { fitView } = useReactFlow()
  useLayoutEffect(() => {
    apiRef.current = {
      fitView: (opts) =>
        fitView(opts ?? { padding: 0.35, duration: 500 }),
    }
    return () => {
      apiRef.current = null
    }
  }, [apiRef, fitView])
  return null
}

const DAGView = forwardRef(function DAGView(
  { gfxQuality = 'high', orbitMode = false, onOrbitModeChange },
  ref
) {
  const { agentState, setAgentState } = useContext(AppContext)
  const [selectedNode, setSelectedNode] = useState(null)
  const [displayNodes, setDisplayNodes] = useState([])
  const [edgeReveal, setEdgeReveal] = useState(false)
  const apiRef = useRef(null)
  const shellRef = useRef(null)

  const { dagNodes, dagEdges, running, workflowId } = agentState

  const onNodesChange = useCallback(
    (changes) => {
      setAgentState((prev) => ({
        ...prev,
        dagNodes: applyNodeChanges(changes, prev.dagNodes),
      }))
    },
    [setAgentState]
  )

  const rfEdges = useMemo(
    () =>
      dagEdges.map((e) => ({
        ...e,
        animated: running,
        style: {
          stroke: '#8B5CF6',
          strokeWidth: 2,
          strokeDasharray: edgeReveal ? 0 : 999,
          strokeDashoffset: edgeReveal ? 0 : 999,
        },
        className: edgeReveal ? 'dag-edge-reveal' : '',
      })),
    [dagEdges, running, edgeReveal]
  )

  const onFlowInit = useCallback((instance) => {
    instance.fitView({ padding: 0.3, duration: 200 })
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      fitView: (opts) => apiRef.current?.fitView?.(opts),
    }),
    []
  )

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node))
  }, [])

  const isEmpty = dagNodes.length === 0
  const sphereInteractive = isEmpty || orbitMode
  const showDag = dagNodes.length > 0

  useEffect(() => {
    if (isEmpty) onOrbitModeChange?.(false)
  }, [isEmpty, onOrbitModeChange])

  useEffect(() => {
    if (orbitMode) setSelectedNode(null)
  }, [orbitMode])

  useEffect(() => {
    setDisplayNodes(dagNodes)
    setEdgeReveal(dagNodes.length > 0)
  }, [dagNodes])

  return (
    <div
      ref={shellRef}
      className="h-full w-full min-h-0 flex-1 relative overflow-hidden rounded-2xl border border-white/[0.08]
        bg-[#0a0912]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm
        ring-1 ring-inset ring-accent/[0.07]"
    >
      <div className="absolute inset-0 z-0 orb-shell opacity-100">
        <CanvasErrorBoundary>
          <WorkflowSphere interactive={sphereInteractive} quality={gfxQuality} />
        </CanvasErrorBoundary>
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1] rounded-2xl bg-gradient-to-b from-[#0a0912]/75 via-transparent to-[#0a0912]/90"
      />
      <div className="pointer-events-none absolute inset-0 z-[1] rounded-2xl bg-gradient-to-r from-[#0a0912]/55 via-transparent to-[#0a0912]/55" />
      <div className="absolute inset-0 z-[2] rounded-2xl bg-gradient-to-b from-accent/[0.03] via-transparent to-transparent pointer-events-none" />

      <div
        className={`relative z-10 h-full min-h-0 w-full ${sphereInteractive ? 'pointer-events-none' : ''}`}
      >
        {!showDag ? (
          <EmptyState />
        ) : (
          <ReactFlow
            key={workflowId ?? 'no-workflow'}
            className={`h-full w-full min-h-0 animate-fade-in ${orbitMode ? 'dag-reactflow-orbit' : ''} ${edgeReveal ? 'dag-edges-drawing' : ''}`}
            nodes={displayNodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeClick={onNodeClick}
            onInit={onFlowInit}
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={!orbitMode}
            nodesConnectable={false}
            elementsSelectable={!orbitMode}
            selectionOnDrag={false}
            selectNodesOnDrag={false}
            panOnDrag={!orbitMode}
            zoomOnScroll={!orbitMode}
            zoomOnPinch={!orbitMode}
            panOnScroll={!orbitMode}
            zoomOnDoubleClick={!orbitMode}
            preventScrolling={!orbitMode}
          >
            <Background color="rgba(99, 102, 241, 0.09)" gap={28} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(n) => {
                const s = n.data?.status
                if (s === 'done') return '#34D399'
                if (s === 'running') return '#FBBF24'
                if (s === 'failed') return '#F87171'
                return '#6366f188'
              }}
              maskColor="rgba(8,7,15,0.72)"
            />
            <DagFitBridge apiRef={apiRef} />
          </ReactFlow>
        )}
      </div>

      {selectedNode && (
        <NodeDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}

      {running && (
        <div
          className="absolute top-4 left-4 z-[22] flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/35
            bg-accent/15 text-accent-light text-xs font-semibold backdrop-blur-md shadow-glow-sm animate-scale-in pointer-events-none"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-50" />
            <span className="relative rounded-full h-2 w-2 bg-accent-light" />
          </span>
          Agent Running
        </div>
      )}
    </div>
  )
})

export default DAGView

function EmptyState() {
  return (
    <div
      className="relative z-10 flex h-full min-h-[200px] flex-col items-center justify-center gap-4 text-center px-8 select-none pointer-events-none"
    >
      <div className="animate-float">
        <GitBranch
          size={36}
          className="text-accent-light drop-shadow-[0_0_28px_rgba(167,139,250,0.85)]"
          strokeWidth={1.5}
        />
      </div>
      <div
        className="space-y-2 max-w-[280px] animate-fade-in-up"
        style={{ animationDelay: '120ms', animationFillMode: 'backwards' }}
      >
        <p className="text-base font-bold text-text-primary [text-shadow:0_2px_24px_rgba(0,0,0,0.85)]">
          No workflow yet
        </p>
        <p className="text-xs text-text-muted/95 leading-relaxed [text-shadow:0_1px_16px_rgba(0,0,0,0.9)]">
          Run the agent below — the graph will build over this orb
        </p>
      </div>
    </div>
  )
}

function NodeDrawer({ node, onClose }) {
  return (
    <div
      className="absolute top-4 right-4 bottom-4 w-72 bg-surface/95 border border-white/[0.1] rounded-2xl
        shadow-panel backdrop-blur-xl overflow-hidden animate-slide-in-right z-30 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
        <span className="text-sm font-semibold text-text-primary">Step Detail</span>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all duration-200 text-lg leading-none flex items-center justify-center"
        >
          ×
        </button>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Label</p>
          <p className="text-sm font-mono text-accent-light">{node.data.label}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Tool</p>
          <p className="text-sm font-mono text-text-primary">{node.data.tool}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Status</p>
          <StatusBadge status={node.data.status} />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Node ID</p>
          <p className="text-xs font-mono text-text-muted">{node.id}</p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status = 'pending' }) {
  const colors = {
    pending: 'text-text-muted bg-surface-2',
    running: 'text-warning bg-amber-950/40 border border-warning/25',
    done: 'text-success bg-emerald-950/35 border border-success/25',
    failed: 'text-error bg-red-950/35 border border-error/25',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
