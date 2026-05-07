'use client'

import { useEffect, useRef } from 'react'
import { scoreColor, scoreLabel } from '@/types/audit'

interface Props {
  score: number
  size?: number
  strokeWidth?: number
}

export function ScoreRing({ score, size = 140, strokeWidth = 10 }: Props) {
  const circleRef = useRef<SVGCircleElement>(null)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const color = scoreColor(score)
  const label = scoreLabel(score)

  useEffect(() => {
    const circle = circleRef.current
    if (!circle) return

    // Start at 0 (full dash offset = hidden), animate to final score
    const targetOffset = circumference - (score / 100) * circumference
    circle.style.strokeDashoffset = String(circumference)

    const raf = requestAnimationFrame(() => {
      circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
      circle.style.strokeDashoffset = String(targetOffset)
    })

    return () => cancelAnimationFrame(raf)
  }, [score, circumference])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(245,240,232,0.07)"
            strokeWidth={strokeWidth}
          />
          {/* Animated progress ring */}
          <circle
            ref={circleRef}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
        </svg>

        {/* Score number in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatedNumber target={score} />
          <span className="text-xs text-[rgba(245,240,232,0.45)] mt-0.5 font-medium tracking-wide">/100</span>
        </div>
      </div>

      {/* Status label */}
      <div
        className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
        style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}40` }}
      >
        {label}
      </div>
    </div>
  )
}

function AnimatedNumber({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const start = Date.now()
    const duration = 1200

    function tick() {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      el!.textContent = String(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [target])

  return (
    <span
      ref={ref}
      className="text-4xl font-bold tabular-nums"
      style={{ color: scoreColor(target) }}
    >
      0
    </span>
  )
}
