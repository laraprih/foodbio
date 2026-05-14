import { FastifyInstance } from 'fastify'
import prisma from '@/lib/prisma'
import { redis } from '@/lib/redis'

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_request, reply) => {
    let db = 'ok'
    let cache = 'ok'

    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      db = 'degraded'
    }

    try {
      await redis.ping()
    } catch {
      cache = 'degraded'
    }

    const status = db === 'ok' && cache === 'ok' ? 'ok' : 'degraded'
    return reply.status(200).send({ status, db, cache, uptime: process.uptime(), version: '2.0.0' })
  })
}
