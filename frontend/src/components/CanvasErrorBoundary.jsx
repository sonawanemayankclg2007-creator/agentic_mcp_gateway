import React from 'react'

export default class CanvasErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[WorkflowSphere]', error, info?.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-2 rounded-2xl border border-warning/30 bg-[#0a0912]/95 p-6 text-center pointer-events-auto"
        >
          <p className="text-sm font-semibold text-warning">3D preview paused</p>
          <p className="text-xs text-text-muted max-w-[240px] leading-relaxed">
            WebGL hit an error on this device. The rest of the app works — run workflows as usual.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-white/10"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
