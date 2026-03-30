import React, { Suspense, useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  MeshDistortMaterial,
  Sphere,
  OrbitControls,
  Stars,
  Sparkles,
  Float,
} from '@react-three/drei'

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduce
}

/** Thin sparkle cloud locked to each rotating ring plane */
function RingSparkles({ high, color, scaleXZ, yScale = 0.14, count, size, speed = 0.45 }) {
  return (
    <Sparkles
      count={count}
      scale={[scaleXZ, yScale, scaleXZ]}
      size={size}
      speed={speed}
      opacity={high ? 0.75 : 0.55}
      color={color}
    />
  )
}

function OrbitRings({ reducedMotion, high }) {
  const g1 = useRef(null)
  const g2 = useRef(null)
  const g3 = useRef(null)
  const g4 = useRef(null)

  const seg = useMemo(
    () =>
      high
        ? { r1: [220, 72], r2: [196, 64], r3: [180, 60], r4: [168, 56] }
        : { r1: [48, 18], r2: [40, 16], r3: [32, 14] },
    [high]
  )

  useFrame((s) => {
    if (reducedMotion) return
    const t = s.clock.elapsedTime
    if (g1.current) {
      g1.current.rotation.z = t * 0.34
      g1.current.rotation.x = 1.05 + Math.sin(t * 0.25) * 0.06
    }
    if (g2.current) {
      g2.current.rotation.z = -t * 0.24
      g2.current.rotation.y = t * 0.13
    }
    if (g3.current) {
      g3.current.rotation.x = 1.45 + Math.sin(t * 0.18) * 0.04
      g3.current.rotation.z = t * 0.11
    }
    if (high && g4.current) {
      g4.current.rotation.y = -t * 0.19
      g4.current.rotation.x = 0.65 + Math.sin(t * 0.12) * 0.08
    }
  })

  const ringMat = (color, opacity) => (
    <meshBasicMaterial
      color={color}
      transparent
      opacity={opacity}
      side={THREE.DoubleSide}
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      toneMapped
    />
  )

  const [rad1, tub1] = seg.r1
  const [rad2, tub2] = seg.r2
  const [rad3, tub3] = seg.r3

  const c1 = high ? 100 : 28
  const c2 = high ? 85 : 22
  const c3 = high ? 70 : 18
  const c4 = high ? 60 : 0
  const sz = high ? 3.2 : 2.2

  return (
    <group>
      <group ref={g1} rotation={[0.9, 0.35, 0]}>
        <mesh>
          <torusGeometry args={[2.12, high ? 0.02 : 0.018, rad1, tub1]} />
          {ringMat('#fae8ff', high ? 0.72 : 0.5)}
        </mesh>
        <RingSparkles
          high={high}
          color="#ffffff"
          scaleXZ={2.32}
          count={c1}
          size={sz}
          speed={0.5}
        />
      </group>
      <group ref={g2} rotation={[0.25, 1.05, 0.15]}>
        <mesh>
          <torusGeometry args={[2.48, high ? 0.014 : 0.012, rad2, tub2]} />
          {ringMat('#c7d2fe', high ? 0.52 : 0.34)}
        </mesh>
        <RingSparkles
          high={high}
          color="#a5b4fc"
          scaleXZ={2.68}
          count={c2}
          size={sz * 0.92}
          speed={0.38}
        />
      </group>
      <group ref={g3} rotation={[1.35, 0.08, 0.4]}>
        <mesh>
          <torusGeometry args={[1.78, high ? 0.016 : 0.012, rad3, tub3]} />
          {ringMat('#a7f3d0', high ? 0.42 : 0.26)}
        </mesh>
        <RingSparkles
          high={high}
          color="#6ee7b7"
          scaleXZ={1.98}
          count={c3}
          size={sz * 0.85}
          speed={0.42}
        />
      </group>
      {high && 'r4' in seg && (
        <group ref={g4} rotation={[0.5, 2.1, 0.7]}>
          <mesh>
            <torusGeometry args={[2.28, 0.01, seg.r4[0], seg.r4[1]]} />
            {ringMat('#f5d0fe', 0.32)}
          </mesh>
          <RingSparkles high color="#f0abfc" scaleXZ={2.48} count={c4} size={sz * 0.8} speed={0.33} />
        </group>
      )}
    </group>
  )
}

function CoreEmber({ reducedMotion, high }) {
  const ref = useRef(null)
  const wSeg = high ? 128 : 32
  const hSeg = high ? 128 : 32

  useFrame((s) => {
    if (!ref.current || reducedMotion) return
    const t = s.clock.elapsedTime
    ref.current.rotation.y = -t * 0.55
    ref.current.rotation.x = Math.sin(t * 0.3) * 0.08
    const pulse = 0.97 + Math.sin(t * 1.4) * 0.04
    ref.current.scale.setScalar((high ? 0.5 : 0.46) * pulse)
    const mat = ref.current.material
    if (mat && high) {
      mat.emissiveIntensity = 2.15 + Math.sin(t * 2.1) * 0.35
    }
  })

  return (
    <mesh ref={ref} scale={high ? 0.5 : 0.46}>
      <sphereGeometry args={[1, wSeg, hSeg]} />
      <meshPhysicalMaterial
        color={high ? '#0c0518' : '#140a22'}
        emissive={high ? '#e879f9' : '#c026d3'}
        emissiveIntensity={high ? 2.15 : 1.35}
        roughness={high ? 0.08 : 0.32}
        metalness={high ? 0.82 : 0.5}
        clearcoat={high ? 0.95 : 0.35}
        clearcoatRoughness={high ? 0.12 : 0.42}
        iridescence={high ? 0.85 : 0}
        iridescenceIOR={high ? 1.3 : 1}
        iridescenceThicknessRange={high ? [100, 400] : [0, 0]}
        envMapIntensity={0}
      />
    </mesh>
  )
}

function GatewayCore({ reducedMotion, high }) {
  const ref = useRef(null)
  const wSeg = high ? 160 : 40
  const hSeg = high ? 160 : 40

  useFrame((state) => {
    if (!ref.current || reducedMotion) return
    const t = state.clock.elapsedTime
    ref.current.rotation.y = t * 0.14
    ref.current.rotation.x = Math.sin(t * 0.08) * 0.12
  })

  return (
    <Sphere ref={ref} args={[1, wSeg, hSeg]} scale={1.44}>
      <MeshDistortMaterial
        color={high ? '#1a1332' : '#312e81'}
        emissive={high ? '#9333ea' : '#7c3aed'}
        emissiveIntensity={high ? 0.85 : 0.55}
        roughness={high ? 0.08 : 0.2}
        metalness={high ? 0.98 : 0.88}
        clearcoat={high ? 0.75 : 0.28}
        clearcoatRoughness={high ? 0.1 : 0.32}
        envMapIntensity={0}
        distort={high ? 0.38 : 0.32}
        speed={reducedMotion ? 0 : high ? 2.65 : 2.2}
      />
    </Sphere>
  )
}

/** Inner soft bloom disc — additive */
function CoreHaloDisk({ high }) {
  const ref = useRef(null)
  useFrame((s) => {
    if (!ref.current) return
    const t = s.clock.elapsedTime
    ref.current.rotation.z = t * 0.08
    const sc = 0.62 + Math.sin(t * 1.8) * 0.04
    ref.current.scale.setScalar(sc)
  })

  return (
    <mesh ref={ref} rotation={[1.1, 0.4, 0.35]}>
      <circleGeometry args={[high ? 1.35 : 1.2, high ? 64 : 24]} />
      <meshBasicMaterial
        color={high ? '#d946ef' : '#a855f7'}
        transparent
        opacity={high ? 0.2 : 0.12}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/** Outer “corona” — backface sphere for soft violet rim */
function CoronalRim({ high }) {
  return (
    <mesh scale={high ? 2.02 : 1.92}>
      <sphereGeometry args={[1, high ? 48 : 24, high ? 48 : 24]} />
      <meshBasicMaterial
        color={high ? '#7c3aed' : '#6d28d9'}
        transparent
        opacity={high ? 0.22 : 0.14}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

/** Glassy ion shell — high quality only */
function IonShell({ high }) {
  if (!high) return null
  return (
    <mesh scale={1.58}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhysicalMaterial
        color="#ede9fe"
        transparent
        opacity={0.08}
        roughness={0.05}
        metalness={0.2}
        transmission={0.65}
        thickness={0.35}
        ior={1.45}
        attenuationDistance={2}
        attenuationColor="#7c3aed"
        emissive="#8b5cf6"
        emissiveIntensity={0.09}
        depthWrite={false}
        envMapIntensity={0}
      />
    </mesh>
  )
}

function OuterHalo({ reducedMotion, high }) {
  const ref = useRef(null)
  const detail = high ? 4 : 1

  useFrame((state) => {
    if (!ref.current || reducedMotion) return
    const t = state.clock.elapsedTime
    ref.current.rotation.x = -t * 0.06
    ref.current.rotation.y = t * 0.09
  })

  return (
    <mesh ref={ref} scale={high ? 2.12 : 2.02}>
      <icosahedronGeometry args={[1, detail]} />
      <meshStandardMaterial
        color="#ddd6fe"
        wireframe
        transparent
        opacity={high ? 0.14 : 0.08}
        depthWrite={false}
        emissive="#a78bfa"
        emissiveIntensity={high ? 0.15 : 0.06}
        metalness={high ? 0.55 : 0}
        roughness={0.28}
      />
    </mesh>
  )
}

function OuterLattice({ reducedMotion, high }) {
  const ref = useRef(null)
  useFrame((s) => {
    if (!ref.current || reducedMotion || !high) return
    const t = s.clock.elapsedTime
    ref.current.rotation.x = t * 0.04
    ref.current.rotation.z = -t * 0.03
  })
  if (!high) return null
  return (
    <mesh ref={ref} scale={2.35}>
      <icosahedronGeometry args={[1, 3]} />
      <meshStandardMaterial
        color="#a855f7"
        wireframe
        transparent
        opacity={0.055}
        depthWrite={false}
      />
    </mesh>
  )
}

function AmbientSparkField({ high }) {
  return (
    <Sparkles
      position={[0, 0, 0]}
      count={high ? 220 : 48}
      scale={high ? 6.8 : 5.2}
      size={high ? 4 : 2.8}
      speed={0.28}
      opacity={0.35}
      color="#e9d5ff"
    />
  )
}

function DriftLight({ reducedMotion, high }) {
  const ref = useRef(null)
  useFrame((state) => {
    if (!ref.current || reducedMotion) return
    const t = state.clock.elapsedTime
    const r = high ? 2.55 : 2.2
    ref.current.position.x = Math.sin(t * 0.7) * r
    ref.current.position.y = Math.cos(t * 0.5) * 1.15
    ref.current.intensity = (high ? 1.35 : 0.85) + Math.sin(t * 2.2) * 0.15
  })
  return (
    <pointLight
      ref={ref}
      position={[2, 1, 3]}
      intensity={high ? 1.35 : 0.85}
      color={high ? '#fef3c7' : '#f0abfc'}
      distance={16}
      decay={2}
    />
  )
}

function PulsingLights({ high }) {
  const refA = useRef(null)
  const refB = useRef(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (refA.current) {
      refA.current.intensity = (high ? 1.18 : 0.88) + Math.sin(t * 1.7) * 0.12
    }
    if (refB.current && high) {
      refB.current.intensity = 0.55 + Math.sin(t * 2.4 + 1) * 0.18
    }
  })
  return (
    <>
      <pointLight
        ref={refA}
        position={[-4.2, 1.2, 3.8]}
        intensity={high ? 1.18 : 0.88}
        color="#a5b4fc"
        distance={20}
        decay={2}
      />
      {high && (
        <pointLight
          ref={refB}
          position={[3.5, -2.2, -2.5]}
          intensity={0.55}
          color="#f472b6"
          distance={14}
          decay={2}
        />
      )}
    </>
  )
}

function OrbArtifact({ high, reducedMotion }) {
  const content = (
    <group>
      <ambientLight intensity={high ? 0.28 : 0.26} color={high ? '#e0e7ff' : '#ffffff'} />
      <hemisphereLight intensity={high ? 0.48 : 0.22} color="#f5f3ff" groundColor="#05020a" />
      <directionalLight
        position={[7, 9, 5.5]}
        intensity={high ? 1.15 : 0.78}
        color="#fffbeb"
        castShadow={false}
      />
      <directionalLight
        position={[-5.5, -2.5, -4.5]}
        intensity={high ? 0.42 : 0.24}
        color="#6366f1"
        castShadow={false}
      />
      <directionalLight position={[0, 8, -6]} intensity={high ? 0.28 : 0.14} color="#22d3ee" castShadow={false} />
      <PulsingLights high={high} />
      <pointLight position={[3.2, 2.4, -1.8]} intensity={high ? 0.55 : 0.38} color="#34d399" distance={15} decay={2} />
      <pointLight position={[0, -3.2, -0.8]} intensity={high ? 0.38 : 0.2} color="#c084fc" distance={12} decay={2} />
      <DriftLight reducedMotion={reducedMotion} high={high} />

      <CoronalRim high={high} />
      <IonShell high={high} />
      <OuterHalo reducedMotion={reducedMotion} high={high} />
      <OuterLattice reducedMotion={reducedMotion} high={high} />
      <OrbitRings reducedMotion={reducedMotion} high={high} />
      <AmbientSparkField high={high} />

      <group position={[0, 0, 0]} renderOrder={2}>
        <CoreHaloDisk high={high} />
        <CoreEmber reducedMotion={reducedMotion} high={high} />
        <GatewayCore reducedMotion={reducedMotion} high={high} />
      </group>
    </group>
  )

  if (reducedMotion) {
    return content
  }

  return (
    <Float
      speed={high ? 1.35 : 1}
      rotationIntensity={high ? 0.22 : 0.12}
      floatIntensity={high ? 0.42 : 0.24}
      floatingRange={high ? [-0.1, 0.1] : [-0.06, 0.06]}
    >
      {content}
    </Float>
  )
}

function Scene({ interactive, high }) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <>
      <Stars
        radius={high ? 110 : 85}
        depth={high ? 52 : 40}
        count={high ? 3200 : 700}
        saturation={0.12}
        factor={high ? 3.2 : 2.4}
        fade
        speed={reducedMotion ? 0 : high ? 0.35 : 0.2}
      />

      <OrbArtifact high={high} reducedMotion={reducedMotion} />

      {interactive && (
        <OrbitControls
          makeDefault
          enableZoom
          enablePan
          enableRotate
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI - 0.1}
          minDistance={2.15}
          maxDistance={24}
          zoomSpeed={0.85}
          rotateSpeed={0.68}
          panSpeed={0.65}
          screenSpacePanning
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
          enableDamping={!reducedMotion}
          dampingFactor={high ? 0.065 : 0.08}
        />
      )}
    </>
  )
}

/**
 * @param {object} props
 * @param {boolean} [props.interactive]
 * @param {'high' | 'low'} [props.quality]
 */
export default function WorkflowSphere({ interactive = false, quality = 'high' }) {
  const high = quality === 'high'
  const dprMax = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
  const dpr = high ? [1, Math.min(dprMax, 2)] : [1, 1]

  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden rounded-2xl select-none ${
        interactive ? 'pointer-events-auto cursor-grab active:cursor-grabbing touch-none' : 'pointer-events-none'
      }`}
      role={interactive ? 'application' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? '3D workflow core. Drag to rotate, scroll to zoom, right-drag to pan.' : undefined}
      {...(interactive ? {} : { 'aria-hidden': true })}
    >
      <Canvas
        key={quality}
        camera={{ position: [0, 0.12, high ? 8.5 : 9.0], fov: high ? 32 : 36 }}
        dpr={dpr}
        gl={{
          alpha: true,
          antialias: high,
          powerPreference: high ? 'high-performance' : 'default',
          failIfMajorPerformanceCaveat: false,
          stencil: false,
          depth: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: high ? 1.05 : 0.92,
        }}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
        }}
      >
        <Suspense fallback={null}>
          <Scene interactive={interactive} high={high} />
        </Suspense>
      </Canvas>
    </div>
  )
}
