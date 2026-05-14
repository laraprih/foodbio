'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { getSession } from 'next-auth/react'
import type { Session } from 'next-auth'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false })

export const useSocketContext = () => useContext(SocketContext)

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let socketInstance: Socket | null = null

    const initSocket = async () => {
      let session: (Session & { accessToken?: string }) | null = null

      try {
        session = (await getSession()) as (Session & { accessToken?: string }) | null
      } catch {
        // NextAuth não configurado ou servidor indisponível — socket não conecta
        return
      }

      const token = session?.accessToken
      if (!token) return

      socketInstance = getSocket()
      socketInstance.auth = { token }

      if (!socketInstance.connected) {
        socketInstance.connect()
      }

      setSocket(socketInstance)

      socketInstance.on('connect', () => setConnected(true))

      socketInstance.on('disconnect', (reason) => {
        setConnected(false)
        if (reason === 'io server disconnect' || reason === 'transport close') {
          setTimeout(() => socketInstance?.connect(), 2000)
        }
      })
    }

    initSocket()

    return () => {
      if (socketInstance) {
        socketInstance.off('connect')
        socketInstance.off('disconnect')
        socketInstance.disconnect()
      }
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}
