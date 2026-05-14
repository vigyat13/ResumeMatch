'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink, Loader2, Lock, Monitor, RefreshCw, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type ConnectionState = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

interface LiveBrowserPreviewProps {
  websocketUrl: string
  sessionId: string
  width?: number
  height?: number
  className?: string
}

interface ControlMessage {
  type: 'click' | 'scroll' | 'type' | 'press' | 'navigate'
  [key: string]: string | number
}

export function LiveBrowserPreview({
  websocketUrl,
  sessionId,
  width = 1280,
  height = 720,
  className,
}: LiveBrowserPreviewProps) {
  const socketRef = useRef<WebSocket | null>(null)
  const connectRef = useRef<() => void>(() => {})
  const reconnectTimerRef = useRef<number | null>(null)
  const imageUrlRef = useRef<string | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [connection, setConnection] = useState<ConnectionState>('idle')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState('about:blank')
  const [address, setAddress] = useState('')

  const fullWsUrl = useMemo(
    () => buildWebSocketUrl(websocketUrl, sessionId),
    [websocketUrl, sessionId],
  )

  const send = useCallback((message: ControlMessage) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify(message))
  }, [])

  const connect = useCallback(() => {
    if (!sessionId) return
    if (socketRef.current?.readyState === WebSocket.OPEN) return

    setConnection('connecting')
    const socket = new WebSocket(fullWsUrl)
    socket.binaryType = 'blob'
    socketRef.current = socket

    socket.onopen = () => setConnection('open')
    socket.onclose = () => {
      setConnection('closed')
      reconnectTimerRef.current = window.setTimeout(() => connectRef.current(), 1200)
    }
    socket.onerror = () => setConnection('error')
    socket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const payload = safeJson(event.data)
        if (payload?.type === 'url' || payload?.type === 'ready') {
          setCurrentUrl(String(payload.url ?? 'about:blank'))
          setAddress(String(payload.url ?? ''))
        }
        return
      }

      const blob = event.data instanceof Blob
        ? event.data
        : new Blob([event.data], { type: 'image/jpeg' })
      const nextUrl = URL.createObjectURL(blob)
      const previous = imageUrlRef.current
      imageUrlRef.current = nextUrl
      setImageUrl(nextUrl)
      if (previous) window.setTimeout(() => URL.revokeObjectURL(previous), 500)
    }
  }, [fullWsUrl, sessionId])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current)
      socketRef.current?.close()
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
    }
  }, [connect])

  const reconnect = useCallback(() => {
    if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current)
    socketRef.current?.close()
    socketRef.current = null
    connect()
  }, [connect])

  const sendPointerClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const point = toBrowserPoint(event.clientX, event.clientY, viewportRef.current, width, height)
    if (!point) return
    viewportRef.current?.focus()
    send({ type: 'click', x: point.x, y: point.y, button: 'left' })
  }, [height, send, width])

  const sendWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    send({ type: 'scroll', deltaX: event.deltaX, deltaY: event.deltaY })
  }, [send])

  const sendKey = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return

    if (event.key.length === 1) {
      event.preventDefault()
      send({ type: 'type', text: event.key })
      return
    }

    const supported = new Set([
      'Backspace',
      'Delete',
      'Enter',
      'Escape',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'PageUp',
      'PageDown',
    ])

    if (supported.has(event.key)) {
      event.preventDefault()
      send({ type: 'press', key: event.key })
    }
  }, [send])

  const navigate = useCallback((event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (!address.trim()) return
    send({ type: 'navigate', url: address.trim() })
  }, [address, send])

  return (
    <section className={cn(
      'overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl',
      className,
    )}>
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#171717] px-3 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>

        <form onSubmit={navigate} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-black/45 px-3 py-1.5">
          <Lock className="h-3.5 w-3.5 shrink-0 text-green-400" />
          <input
            value={address}
            onChange={event => setAddress(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs text-white/75 outline-none placeholder:text-white/35"
            placeholder={currentUrl || 'about:blank'}
          />
          <button type="submit" className="rounded-md p-1 text-white/45 transition hover:bg-white/10 hover:text-white">
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="hidden items-center gap-2 text-xs text-white/45 sm:flex">
          <span className={cn(
            'h-2 w-2 rounded-full',
            connection === 'open' ? 'bg-green-400' : connection === 'connecting' ? 'animate-pulse bg-blue-400' : 'bg-red-400',
          )} />
          {connection}
        </div>

        <button
          type="button"
          onClick={reconnect}
          className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Reconnect browser stream"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={viewportRef}
        tabIndex={0}
        role="application"
        aria-label="Live browser preview"
        onClick={sendPointerClick}
        onWheel={sendWheel}
        onKeyDown={sendKey}
        className="relative isolate overflow-hidden bg-[#242424] outline-none"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {!imageUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f6f6f6] text-gray-500">
            {connection === 'connecting' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Monitor className="h-7 w-7" />
            )}
            <p className="text-sm font-medium">{connection === 'open' ? 'Waiting for first frame...' : 'Connecting to browser...'}</p>
          </div>
        )}

        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Live browser frame"
            draggable={false}
            className="h-full w-full select-none object-contain"
          />
        )}

        {connection !== 'open' && imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
            <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm">
              <RotateCw className="h-4 w-4 animate-spin" />
              Reconnecting stream
            </div>
          </div>
        )}

      </div>
    </section>
  )
}

function buildWebSocketUrl(baseUrl: string, sessionId: string): string {
  if (baseUrl.includes('{sessionId}')) {
    return baseUrl.replace('{sessionId}', encodeURIComponent(sessionId))
  }

  const trimmed = baseUrl.replace(/\/$/, '')
  if (trimmed.endsWith(`/${sessionId}`)) return trimmed
  return `${trimmed}/${encodeURIComponent(sessionId)}`
}

function safeJson(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

function toBrowserPoint(
  clientX: number,
  clientY: number,
  element: HTMLDivElement | null,
  browserWidth: number,
  browserHeight: number,
): { x: number; y: number } | null {
  if (!element) return null
  const rect = element.getBoundingClientRect()
  const renderedRatio = rect.width / rect.height
  const browserRatio = browserWidth / browserHeight

  let imageWidth = rect.width
  let imageHeight = rect.height
  let offsetX = 0
  let offsetY = 0

  if (renderedRatio > browserRatio) {
    imageWidth = rect.height * browserRatio
    offsetX = (rect.width - imageWidth) / 2
  } else {
    imageHeight = rect.width / browserRatio
    offsetY = (rect.height - imageHeight) / 2
  }

  const localX = clientX - rect.left - offsetX
  const localY = clientY - rect.top - offsetY

  if (localX < 0 || localY < 0 || localX > imageWidth || localY > imageHeight) {
    return null
  }

  return {
    x: Math.round((localX / imageWidth) * browserWidth),
    y: Math.round((localY / imageHeight) * browserHeight),
  }
}
