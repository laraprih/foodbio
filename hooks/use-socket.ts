import { useEffect, useState, useCallback } from 'react'
import { useSocketContext } from '@/components/providers/SocketProvider'

type SocketListeners = Record<string, (data: unknown) => void>

export function useSocket(room?: string, listeners?: SocketListeners) {
  const { socket, connected: contextConnected } = useSocketContext()
  const [connected, setConnected] = useState(contextConnected)

  useEffect(() => {
    setConnected(contextConnected)
  }, [contextConnected])

  // Join/leave room
  useEffect(() => {
    if (!socket || !room) return
    socket.emit('join', room)
    return () => { socket.emit('leave', room) }
  }, [socket, room])

  // Register event listeners
  useEffect(() => {
    if (!socket || !listeners) return
    const entries = Object.entries(listeners)
    entries.forEach(([event, handler]) => socket.on(event, handler))
    return () => { entries.forEach(([event, handler]) => socket.off(event, handler)) }
  }, [socket, listeners])

  const emit = useCallback((event: string, data?: unknown) => {
    if (socket?.connected) {
      socket.emit(event, data)
    }
  }, [socket])

  return { socket, connected, emit }
}
