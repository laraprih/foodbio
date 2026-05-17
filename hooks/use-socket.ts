import { useEffect, useRef, useState, useCallback } from 'react'
import { useSocketContext } from '@/components/providers/SocketProvider'

type SocketListeners = Record<string, (data: unknown) => void>

export function useSocket(room?: string, listeners?: SocketListeners) {
  const { socket, connected: contextConnected } = useSocketContext()
  const [connected, setConnected] = useState(contextConnected)

  // Keep listeners ref always up-to-date without triggering re-registration
  const listenersRef = useRef<SocketListeners | undefined>(listeners)
  listenersRef.current = listeners

  useEffect(() => {
    setConnected(contextConnected)
  }, [contextConnected])

  // Join / leave room
  useEffect(() => {
    if (!socket || !room) return
    socket.emit('join', room)
    return () => { socket.emit('leave', room) }
  }, [socket, room])

  // Register stable wrapper handlers — only re-run when socket changes
  useEffect(() => {
    if (!socket || !listenersRef.current) return
    const events = Object.keys(listenersRef.current)
    const wrappers: Record<string, (data: unknown) => void> = {}
    events.forEach(event => {
      wrappers[event] = (data: unknown) => listenersRef.current?.[event]?.(data)
      socket.on(event as any, wrappers[event])
    })
    return () => {
      events.forEach(event => socket.off(event as any, wrappers[event]))
    }
  }, [socket]) // eslint-disable-line react-hooks/exhaustive-deps

  const emit = useCallback((event: string, data?: unknown) => {
    if (socket?.connected) socket.emit(event as any, data)
  }, [socket])

  return { socket, connected, emit }
}
