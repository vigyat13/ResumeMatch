'use client'

import { useEffect, useState, useRef } from 'react'

interface TypewriterTextProps {
  text: string
  speed?: number
  onComplete?: () => void
  className?: string
}

/**
 * Animates text appearing character-by-character (typewriter effect).
 * Used during optimization apply to show live bullet changes.
 */
export function TypewriterText({ text, speed = 18, onComplete, className }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)
  const prevTextRef = useRef('')

  useEffect(() => {
    // Reset on new text
    if (text !== prevTextRef.current) {
      prevTextRef.current = text
      indexRef.current = 0
      setDisplayed('')
    }

    if (!text) return

    const interval = setInterval(() => {
      indexRef.current += 1
      if (indexRef.current >= text.length) {
        setDisplayed(text)
        clearInterval(interval)
        onComplete?.()
      } else {
        setDisplayed(text.slice(0, indexRef.current))
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, onComplete])

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-primary animate-pulse ml-[1px] align-middle" />
      )}
    </span>
  )
}

interface MorphTextProps {
  from: string
  to: string
  durationMs?: number
  className?: string
  onComplete?: () => void
}

/**
 * Animates morphing from one text to another with a fade-through effect.
 * Shows "before" fading out, then "after" fading in.
 */
export function MorphText({ from, to, durationMs = 600, className, onComplete }: MorphTextProps) {
  const [phase, setPhase] = useState<'from' | 'transitioning' | 'to'>('from')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transitioning'), 100)
    const t2 = setTimeout(() => {
      setPhase('to')
      onComplete?.()
    }, 100 + durationMs)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [from, to, durationMs, onComplete])

  return (
    <span className={className}>
      {phase === 'from' && (
        <span className="transition-opacity duration-300">{from}</span>
      )}
      {phase === 'transitioning' && (
        <span className="opacity-40 transition-opacity duration-300 line-through text-muted-foreground">{from}</span>
      )}
      {phase === 'to' && (
        <span className="animate-in fade-in duration-300">{to}</span>
      )}
    </span>
  )
}

interface AnimatedDiffProps {
  before: string
  after: string
  delay?: number
  className?: string
}

/**
 * Shows a before→after diff with strikethrough animation then typewriter for new text.
 * Perfect for showing bullet point improvements in real-time.
 */
export function AnimatedDiff({ before, after, delay = 0, className }: AnimatedDiffProps) {
  const [stage, setStage] = useState<'waiting' | 'striking' | 'typing' | 'done'>('waiting')

  useEffect(() => {
    const t1 = setTimeout(() => setStage('striking'), delay)
    const t2 = setTimeout(() => setStage('typing'), delay + 500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [delay])

  if (stage === 'waiting') {
    return <span className={className}>{before}</span>
  }

  if (stage === 'striking') {
    return (
      <span className={className}>
        <span className="line-through text-muted-foreground/60 transition-all duration-500">{before}</span>
      </span>
    )
  }

  return (
    <span className={className}>
      <TypewriterText text={after} speed={14} onComplete={() => setStage('done')} />
    </span>
  )
}
