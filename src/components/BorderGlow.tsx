import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import './BorderGlow.css'

type HslValue = {
  h: number
  s: number
  l: number
}

type BorderGlowProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  edgeSensitivity?: number
  glowColor?: string
  backgroundColor?: string
  borderRadius?: number
  glowRadius?: number
  glowIntensity?: number
  coneSpread?: number
  animated?: boolean
  colors?: string[]
  fillOpacity?: number
}

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%']
const GRADIENT_KEYS = [
  '--gradient-one',
  '--gradient-two',
  '--gradient-three',
  '--gradient-four',
  '--gradient-five',
  '--gradient-six',
  '--gradient-seven',
] as const
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1]

function parseHSL(hslStr: string): HslValue {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)
  if (!match) {
    return { h: 40, s: 80, l: 80 }
  }

  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) }
}

function buildGlowVars(glowColor: string, intensity: number) {
  const { h, s, l } = parseHSL(glowColor)
  const base = `${h}deg ${s}% ${l}%`
  const opacities = [100, 60, 50, 40, 30, 20, 10]
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10']
  const vars: Record<string, string> = {}

  opacities.forEach((opacity, index) => {
    vars[`--glow-color${keys[index]}`] = `hsl(${base} / ${Math.min(opacity * intensity, 100)}%)`
  })

  return vars
}

function buildGradientVars(colors: string[]) {
  const vars: Record<string, string> = {}

  for (let index = 0; index < 7; index += 1) {
    const color = colors[Math.min(COLOR_MAP[index], colors.length - 1)]
    vars[GRADIENT_KEYS[index]] = `radial-gradient(at ${GRADIENT_POSITIONS[index]}, ${color} 0px, transparent 50%)`
  }

  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`
  return vars
}

function easeOutCubic(x: number) {
  return 1 - (1 - x) ** 3
}

function easeInCubic(x: number) {
  return x ** 3
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: {
  start?: number
  end?: number
  duration?: number
  delay?: number
  ease?: (x: number) => number
  onUpdate: (value: number) => void
  onEnd?: () => void
}) {
  const startTime = performance.now() + delay

  function tick() {
    const elapsed = performance.now() - startTime
    const t = Math.min(elapsed / duration, 1)
    onUpdate(start + (end - start) * ease(t))

    if (t < 1) {
      requestAnimationFrame(tick)
    } else {
      onEnd?.()
    }
  }

  window.setTimeout(() => requestAnimationFrame(tick), delay)
}

const BorderGlow = ({
  children,
  className = '',
  style,
  edgeSensitivity = 30,
  glowColor = '86 100 70',
  backgroundColor = 'rgba(8, 12, 14, 0.66)',
  borderRadius = 24,
  glowRadius = 38,
  glowIntensity = 0.85,
  coneSpread = 25,
  animated = false,
  colors = ['#b8ff2e', '#67dde0', '#f472b6'],
  fillOpacity = 0.35,
}: BorderGlowProps) => {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const pointerFrameRef = useRef<number | null>(null)
  const latestPointerRef = useRef<{ x: number; y: number } | null>(null)

  const getCenterOfElement = useCallback((element: HTMLElement) => {
    const { width, height } = element.getBoundingClientRect()
    return [width / 2, height / 2]
  }, [])

  const getEdgeProximity = useCallback(
    (element: HTMLElement, x: number, y: number) => {
      const [cx, cy] = getCenterOfElement(element)
      const dx = x - cx
      const dy = y - cy
      let kx = Infinity
      let ky = Infinity

      if (dx !== 0) {
        kx = cx / Math.abs(dx)
      }
      if (dy !== 0) {
        ky = cy / Math.abs(dy)
      }

      return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1)
    },
    [getCenterOfElement],
  )

  const getCursorAngle = useCallback(
    (element: HTMLElement, x: number, y: number) => {
      const [cx, cy] = getCenterOfElement(element)
      const dx = x - cx
      const dy = y - cy
      if (dx === 0 && dy === 0) {
        return 0
      }

      const radians = Math.atan2(dy, dx)
      const degrees = radians * (180 / Math.PI) + 90
      return degrees < 0 ? degrees + 360 : degrees
    },
    [getCenterOfElement],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current
      if (!card) {
        return
      }

      latestPointerRef.current = { x: event.clientX, y: event.clientY }
      if (pointerFrameRef.current !== null) {
        return
      }

      pointerFrameRef.current = requestAnimationFrame(() => {
        pointerFrameRef.current = null
        const frameCard = cardRef.current
        const pointer = latestPointerRef.current
        if (!frameCard || !pointer) {
          return
        }

        const rect = frameCard.getBoundingClientRect()
        const x = pointer.x - rect.left
        const y = pointer.y - rect.top
        const edge = getEdgeProximity(frameCard, x, y)
        const angle = getCursorAngle(frameCard, x, y)

        frameCard.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`)
        frameCard.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`)
      })
    },
    [getCursorAngle, getEdgeProximity],
  )

  useEffect(
    () => () => {
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (!animated || !cardRef.current) {
      return
    }

    const card = cardRef.current
    const angleStart = 110
    const angleEnd = 465
    card.classList.add('sweep-active')
    card.style.setProperty('--cursor-angle', `${angleStart}deg`)

    animateValue({ duration: 500, onUpdate: (value) => card.style.setProperty('--edge-proximity', String(value)) })
    animateValue({
      ease: easeInCubic,
      duration: 1500,
      end: 50,
      onUpdate: (value) => {
        card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`)
      },
    })
    animateValue({
      ease: easeOutCubic,
      delay: 1500,
      duration: 2250,
      start: 50,
      end: 100,
      onUpdate: (value) => {
        card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`)
      },
    })
    animateValue({
      ease: easeInCubic,
      delay: 2500,
      duration: 1500,
      start: 100,
      end: 0,
      onUpdate: (value) => card.style.setProperty('--edge-proximity', String(value)),
      onEnd: () => card.classList.remove('sweep-active'),
    })
  }, [animated])

  return (
    <div
      className={`border-glow-card ${className}`}
      onPointerMove={handlePointerMove}
      ref={cardRef}
      style={
        {
          '--card-bg': backgroundColor,
          '--edge-sensitivity': edgeSensitivity,
          '--border-radius': `${borderRadius}px`,
          '--glow-padding': `${glowRadius}px`,
          '--cone-spread': coneSpread,
          '--fill-opacity': fillOpacity,
          ...buildGlowVars(glowColor, glowIntensity),
          ...buildGradientVars(colors),
          ...style,
        } as CSSProperties
      }
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  )
}

export default BorderGlow
