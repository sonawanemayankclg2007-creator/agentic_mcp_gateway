import React, { useEffect, useMemo, useRef, useState } from 'react'

const PARTICLES = [
  { x: 8, y: 12, s: 2, o: 0.2, d: 4.2, delay: 0 },
  { x: 23, y: 78, s: 1, o: 0.15, d: 6.1, delay: 1.2 },
  { x: 45, y: 23, s: 3, o: 0.35, d: 5.3, delay: 0.8 },
  { x: 67, y: 89, s: 2, o: 0.25, d: 7.2, delay: 2.1 },
  { x: 82, y: 34, s: 1, o: 0.18, d: 4.8, delay: 0.4 },
  { x: 91, y: 67, s: 2, o: 0.3, d: 6.5, delay: 1.7 },
  { x: 15, y: 55, s: 1, o: 0.12, d: 5.9, delay: 3.0 },
  { x: 34, y: 91, s: 3, o: 0.2, d: 4.4, delay: 0.6 },
  { x: 56, y: 45, s: 2, o: 0.28, d: 7.8, delay: 2.4 },
  { x: 78, y: 12, s: 1, o: 0.16, d: 5.1, delay: 1.0 },
  { x: 92, y: 88, s: 2, o: 0.22, d: 6.3, delay: 3.5 },
  { x: 11, y: 33, s: 1, o: 0.14, d: 4.7, delay: 2.8 },
  { x: 29, y: 66, s: 3, o: 0.32, d: 5.6, delay: 0.2 },
  { x: 51, y: 8, s: 2, o: 0.19, d: 8.1, delay: 1.5 },
  { x: 73, y: 52, s: 1, o: 0.24, d: 4.9, delay: 0.9 },
  { x: 88, y: 23, s: 2, o: 0.17, d: 6.7, delay: 2.2 },
  { x: 6, y: 82, s: 3, o: 0.38, d: 5.2, delay: 3.8 },
  { x: 42, y: 71, s: 1, o: 0.13, d: 7.4, delay: 1.3 },
  { x: 64, y: 38, s: 2, o: 0.26, d: 4.6, delay: 0.7 },
  { x: 86, y: 76, s: 1, o: 0.21, d: 6.0, delay: 2.6 },
]

const STATUS_MESSAGES = [
  'Connecting to MCP servers...',
  'Loading GitHub integration...',
  'Loading Jira integration...',
  'Loading Slack integration...',
  'Initialising agent engine...',
  'Ready.',
]

export default function LoadingScreen({ minDisplayMs = 2200, onComplete }) {
  const particles = useMemo(() => PARTICLES, [])
  const startedAtRef = useRef(null)
  const dismissRequestedRef = useRef(false)
  const onCompleteCalledRef = useRef(false)
  const dismissTimerRef = useRef(null)

  const [isPresent, setIsPresent] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)

  const [statusIndex, setStatusIndex] = useState(0)
  const [statusOpacity, setStatusOpacity] = useState(1)

  const dismiss = () => {
    if (dismissRequestedRef.current) return
    dismissRequestedRef.current = true

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const startedAt = startedAtRef.current ?? now
    const elapsed = Math.max(0, now - startedAt)
    const remaining = Math.max(0, minDisplayMs - elapsed)

    if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current)
    dismissTimerRef.current = window.setTimeout(() => {
      setIsDismissing(true)
    }, remaining)
  }

  useEffect(() => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    startedAtRef.current = now
    const t = window.setTimeout(() => setIsVisible(true), 50)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!isVisible) return

    // Status messages cycle (every 800ms) with a 200ms out, then 200ms in crossfade.
    const intervalMs = 800
    const crossfadeMs = 200
    let idxRef = 0

    const tick = () => {
      if (dismissRequestedRef.current) return

      setStatusOpacity(0)
      window.setTimeout(() => {
        if (dismissRequestedRef.current) return
        idxRef = (idxRef + 1) % STATUS_MESSAGES.length
        setStatusIndex(idxRef)
        setStatusOpacity(1)

        // When "Ready." is fully visible, wait 400ms, then call onComplete and dismiss.
        // "Fully visible" occurs after the 200ms fade-in completes.
        if (STATUS_MESSAGES[idxRef] === 'Ready.' && !onCompleteCalledRef.current) {
          onCompleteCalledRef.current = true
          window.setTimeout(() => {
            onComplete?.()
            dismiss()
          }, crossfadeMs + 400)
        }
      }, crossfadeMs)
    }

    const id = window.setInterval(tick, intervalMs)
    return () => window.clearInterval(id)
  }, [isVisible, onComplete])

  useEffect(() => {
    if (!isVisible) return

    // Progress bar: fill from 0% -> 100% over 4000ms, then stays full for 200ms.
    // This dismissal aligns with the "Ready." callback timing for a clean synchronized exit.
    const progressStartDelayMs = 600
    const totalMs = progressStartDelayMs + 4000 + 200
    const t = window.setTimeout(() => {
      dismiss()
    }, totalMs)

    return () => window.clearTimeout(t)
  }, [isVisible, minDisplayMs])

  const handleTransitionEnd = (e) => {
    if (e?.propertyName !== 'opacity') return
    if (!isDismissing) return
    setIsPresent(false)
  }

  if (!isPresent) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap');

        @keyframes spin1 { from { transform: rotateX(72deg) rotateZ(0deg); } to { transform: rotateX(72deg) rotateZ(360deg); } }
        @keyframes spin2 { from { transform: rotateX(72deg) rotateZ(120deg); } to { transform: rotateX(72deg) rotateZ(480deg); } }
        @keyframes spin3 { from { transform: rotateX(72deg) rotateZ(240deg); } to { transform: rotateX(72deg) rotateZ(600deg); } }

        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(124,58,237,0.6), 0 0 60px rgba(124,58,237,0.2); transform: scale(1); }
          50% { box-shadow: 0 0 50px rgba(124,58,237,0.9), 0 0 100px rgba(124,58,237,0.3); transform: scale(1.06); }
        }

        @keyframes satOrbit1 {
          from { transform: rotate(0deg) translateX(52px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(52px) rotate(-360deg); }
        }

        @keyframes satOrbit2 {
          from { transform: rotate(180deg) translateX(44px) rotate(-180deg); }
          to { transform: rotate(540deg) translateX(44px) rotate(-540deg); }
        }

        @keyframes particleFloat {
          0% { transform: translateY(-15px); }
          50% { transform: translateY(15px); }
          100% { transform: translateY(-15px); }
        }

        @keyframes progressFill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>

      <div
        onTransitionEnd={handleTransitionEnd}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          background: 'radial-gradient(ellipse at center, #1E1B2E 0%, #0D0D0D 70%)',
          opacity: isDismissing ? 0 : isVisible ? 1 : 0,
          transition: isDismissing ? 'opacity 600ms ease-in-out' : 'opacity 500ms ease-out',
          overflow: 'hidden',
          color: '#F9FAFB',
          fontFamily: "'Inter', sans-serif",
        }}
        aria-label="Loading"
        role="status"
      >
        {/* Particle background */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
          {particles.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.s}px`,
                height: `${p.s}px`,
                borderRadius: '50%',
                background: '#7C3AED',
                opacity: p.o,
                filter: 'blur(0px)',
                animationName: 'particleFloat',
                animationDuration: `${p.d}s`,
                animationDelay: `${p.delay}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
              }}
            />
          ))}
        </div>

        {/* Centre orb system */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 180,
            height: 180,
          }}
        >
          {/* Layer 1 — outer glow */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
            }}
          />

          {/* Layer 2 — orbital rings */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              perspective: 500,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Ring 1 */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 130,
                height: 130,
                marginLeft: -65,
                marginTop: -65,
                borderRadius: '50%',
                border: '1.5px solid rgba(167,139,250,0.3)',
                animation: 'spin1 4s linear infinite',
              }}
            />

            {/* Ring 2 */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 130,
                height: 130,
                marginLeft: -65,
                marginTop: -65,
                borderRadius: '50%',
                border: '1.5px solid rgba(167,139,250,0.3)',
                animation: 'spin2 5.5s linear infinite',
              }}
            />

            {/* Ring 3 */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 112,
                height: 112,
                marginLeft: -56,
                marginTop: -56,
                borderRadius: '50%',
                border: '1.5px solid rgba(167,139,250,0.18)',
                animation: 'spin3 7s linear infinite',
              }}
            />
          </div>

          {/* Layer 3 — orb core */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 64,
              height: 64,
              marginLeft: -32,
              marginTop: -32,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #C4B5FD 0%, #7C3AED 45%, #3B0764 100%)',
              animation: 'orbPulse 3s ease-in-out infinite',
            }}
          >
            {/* Layer 4 — inner highlight */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                width: 22,
                height: 14,
                borderRadius: '50%',
                background: 'rgba(221,214,254,0.3)',
                top: '18%',
                left: '20%',
                transform: 'rotate(-20deg)',
              }}
            />

            {/* Layer 5 — two satellite dots */}
            {/* Satellite 1 */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 8,
                height: 8,
                marginLeft: -4,
                marginTop: -4,
                borderRadius: '50%',
                background: '#A78BFA',
                animation: 'satOrbit1 4s linear infinite',
                filter: 'drop-shadow(0 0 4px #A78BFA)',
              }}
            />

            {/* Satellite 2 */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 5,
                height: 5,
                marginLeft: -2.5,
                marginTop: -2.5,
                borderRadius: '50%',
                background: '#DDD6FE',
                animation: 'satOrbit2 6.5s linear infinite',
              }}
            />
          </div>
        </div>

        {/* THE TEXT — below the orb */}
        <div style={{ position: 'absolute', top: 'calc(50% + 138px)', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          {/* Line 1 — wordmark */}
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#F9FAFB' }}>AVE</span>
            <span style={{ color: '#A78BFA' }}>Ops</span>
          </div>

          {/* Line 2 — tagline */}
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              fontWeight: 500,
              color: '#7C3AED',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Agentic MCP Gateway
          </div>

          {/* Line 3 — loading status text */}
          <div style={{ marginTop: 20, minHeight: 16, position: 'relative' }}>
            <div
              style={{
                fontSize: 13,
                color: '#6B7280',
                transition: 'opacity 200ms ease-in-out',
                opacity: statusOpacity,
              }}
              aria-live="polite"
            >
              {STATUS_MESSAGES[statusIndex]}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 200,
            height: 2,
            borderRadius: 1,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: 0,
              borderRadius: 1,
              background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
              animationName: 'progressFill',
              animationDuration: '4000ms',
              animationDelay: '600ms',
              animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              animationFillMode: 'forwards',
            }}
          />
        </div>
      </div>
    </>
  )
}
