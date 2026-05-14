import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { redis } from '@/lib/redis'
import logger from '@/lib/logger'
import type { IncomingMessage, ServerResponse, Server as HttpServer } from 'http'

let io: Server

export function initSocket(httpServer: HttpServer<typeof IncomingMessage, typeof ServerResponse>) {
  const pubClient = redis.duplicate()
  const subClient = redis.duplicate()

  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  io.adapter(createAdapter(pubClient, subClient))

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) return next(new Error('Não autenticado'))

    try {
      // Verifica o JWT usando a mesma chave do Fastify
      const { verify } = await import('jsonwebtoken')
      const payload = verify(token, process.env.JWT_SECRET ?? '') as Record<string, unknown>
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Token inválido'))
    }
  })

  io.on('connection', (socket) => {
    const userId = (socket.data.user as Record<string, unknown>)?.id
    logger.info({ socketId: socket.id, userId }, 'Socket connected')

    socket.on('join', (room: string) => {
      socket.join(room)
      logger.debug({ socketId: socket.id, room }, 'Socket joined room')
    })

    socket.on('leave', (room: string) => {
      socket.leave(room)
    })

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Socket disconnected')
    })
  })

  return io
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io não inicializado. Chame initSocket primeiro.')
  return io
}

// Alias mantido para compatibilidade com código existente
export const setupSocket = initSocket
