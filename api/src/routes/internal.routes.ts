import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getIO } from '@/socket'
import logger from '@/lib/logger'

const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

function verifySecret(request: FastifyRequest, reply: FastifyReply): boolean {
  const auth = request.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!INTERNAL_SECRET || token !== INTERNAL_SECRET) {
    reply.status(401).send({ error: 'Não autorizado' })
    return false
  }
  return true
}

export async function internalRoutes(fastify: FastifyInstance) {
  // Emit Socket.IO event to one or more rooms
  // Called server-side by Next.js after DB writes (webhooks, status changes, order creation)
  fastify.post('/emit', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!verifySecret(request, reply)) return

    const { rooms, event, data } = request.body as {
      rooms: string | string[]
      event: string
      data: unknown
    }

    if (!event) return reply.status(400).send({ error: 'event obrigatório' })

    const roomList = Array.isArray(rooms) ? rooms : [rooms]
    const io = getIO()

    for (const room of roomList) {
      io.to(room).emit(event, data)
      logger.debug({ room, event }, 'Internal emit')
    }

    return { ok: true, rooms: roomList, event }
  })
}
