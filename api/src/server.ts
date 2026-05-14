import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { redis } from './lib/redis'
import prisma from './lib/prisma'
import logger from './lib/logger'
import { initSocket } from './socket'
import { adminRoutes } from './routes/admin.routes'
import { clientRoutes } from './routes/client.routes'
import { storeRoutes } from './routes/store.routes'
import { kitchenRoutes } from './routes/kitchen.routes'
import { deliveryRoutes } from './routes/delivery.routes'
import { webhookRoutes } from './routes/webhooks.routes'
import { healthRoutes } from './routes/health.routes'

const fastify = Fastify({ logger: false }) // Pino gerenciado por logger.ts

async function bootstrap() {
  await fastify.register(helmet, { contentSecurityPolicy: false })

  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET não definido') })(),
  })

  await fastify.register(rateLimit, {
    global: false,
    redis,
    keyGenerator: (req) => {
      const user = (req as FastifyRequestWithUser).user
      return `rl:${user?.tenantId ?? req.ip}`
    },
  })

  // Rota de health check (sem auth, sem rate limit)
  await fastify.register(healthRoutes)

  // Auth
  fastify.post('/api/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { login } = await import('./controllers/auth.controller')
    return login(req as Parameters<typeof login>[0], reply)
  })

  // Rotas de negócio
  await fastify.register(clientRoutes,   { prefix: '/api/client' })
  await fastify.register(adminRoutes,    { prefix: '/api/admin' })
  await fastify.register(storeRoutes,    { prefix: '/api/store' })
  await fastify.register(kitchenRoutes,  { prefix: '/api/kitchen' })
  await fastify.register(deliveryRoutes, { prefix: '/api/delivery' })
  await fastify.register(webhookRoutes,  { prefix: '/api/webhooks' })

  const port = Number(process.env.PORT ?? 3001)
  await fastify.listen({ port, host: '0.0.0.0' })
  logger.info({ port, env: process.env.NODE_ENV }, 'Foodin API started')

  // Socket.io sobre o mesmo HTTP server
  initSocket(fastify.server)

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...')
    await fastify.close()
    await prisma.$disconnect()
    await redis.quit()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server')
  process.exit(1)
})

type FastifyRequestWithUser = { user?: { tenantId?: string } }
