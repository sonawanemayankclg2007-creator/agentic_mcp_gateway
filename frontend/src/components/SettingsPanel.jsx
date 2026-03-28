import React from 'react'
import { X, Keyboard, Radio, Sparkles } from 'lucide-react'

const MODULE_KEYS = ['1 · DevOps', '2 · FinOps', '3 · Pricing', '4 · Talent', '5 · Supply Chain', '6 · GeoSpatial']

export default function SettingsPanel({ open, onClose, onPingAll, reducedMotionSystem }) {

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[150] bg-black/55 backdrop-blur-[2px] animate-fade-in border-0 cursor-default p-0"
        aria-label="Close settings"
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 z-[160] h-full w-[min(100vw,380px)] border-l border-white/[0.08] glass-sidebar
          shadow-panel flex flex-col animate-drawer-in"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 border border-accent/25">
              <Sparkles size={18} className="text-accent-light" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Workspace</h2>
              <p className="text-[11px] text-text-muted">Gateway preferences · demo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-2">Integrations</p>
            <button
              type="button"
              onClick={() => onPingAll()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.1]
                bg-white/[0.03] text-sm font-semibold text-text-primary
                hover:border-accent/40 hover:bg-accent/10 hover:shadow-glow-sm transition-all duration-300 active:scale-[0.98]"
            >
              <Radio size={16} className="text-accent-light animate-soft-pulse" />
              Ping all integrations
            </button>
            <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
              Simulates a health check and shows latency toasts for each connector.
            </p>
          </section>

          <section>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-2">
              <Keyboard size={12} />
              Keyboard
            </p>
            <ul className="space-y-2 text-xs text-text-muted rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              {MODULE_KEYS.map((k) => (
                <li key={k} className="flex justify-between gap-2 font-mono text-[11px]">
                  <span className="text-text-primary/90">{k.split(' · ')[1]}</span>
                  <span className="text-accent-light">{k.split(' · ')[0]}</span>
                </li>
              ))}
              <li className="flex justify-between gap-2 font-mono text-[11px] pt-1 border-t border-white/[0.06]">
                <span className="text-text-primary/90">Run agent</span>
                <span className="text-accent-light">Enter</span>
              </li>
              <li className="flex justify-between gap-2 font-mono text-[11px]">
                <span className="text-text-primary/90">Close module menu</span>
                <span className="text-accent-light">Esc</span>
              </li>
            </ul>
          </section>

          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-2">Motion</p>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-xs text-text-muted leading-relaxed">
              <p>
                OS reduced motion:{' '}
                <span className={reducedMotionSystem ? 'text-warning font-semibold' : 'text-success font-semibold'}>
                  {reducedMotionSystem ? 'On' : 'Off'}
                </span>
              </p>
              <p className="mt-2 opacity-90">
                The 3D core and badges honor system preferences automatically. Extra UI flourishes stay lightweight.
              </p>
            </div>
          </section>
        </div>
      </aside>
    </>
  )
}
