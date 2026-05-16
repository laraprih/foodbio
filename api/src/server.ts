import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
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
import { internalRoutes } from './routes/internal.routes'

const fastify = Fastify({ logger: false }) // Pino gerenciado por logger.ts

async function bootstrap() {
  await fastify.register(helmet, { contentSecurityPolicy: false })
  await fastify.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } }) // 5MB

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

  // Social login — verifica token com Facebook Graph API e cria/vincula usuário
  fastify.post('/api/auth/social', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (req: any, reply) => {
    const { provider, accessToken } = req.body as { provider: string; accessToken: string }

    if (provider !== 'facebook') {
      return reply.status(400).send({ error: 'Provider não suportado' })
    }

    // Verifica token diretamente com o Facebook
    const fbRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`
    )

    const profile = await fbRes.json() as {
      id?: string; name?: string; email?: string
      picture?: { data: { url: string } }; error?: { message: string }
    }

    if (!fbRes.ok || profile.error || !profile.id) {
      return reply.status(401).send({ error: 'Token inválido' })
    }

    let user = await prisma.user.findFirst({ where: { facebookId: profile.id } })

    if (!user && profile.email) {
      user = await prisma.user.findUnique({ where: { email: profile.email } })
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            facebookId: profile.id,
            avatarUrl: user.avatarUrl ?? profile.picture?.data?.url,
          },
        })
      }
    }

    if (!user) {
      const email = profile.email ?? `fb_${profile.id}@foodbio.social`
      user = await prisma.user.create({
        data: {
          name: profile.name ?? 'Usuário',
          email,
          role: 'customer',
          facebookId: profile.id,
          avatarUrl: profile.picture?.data?.url,
        },
      })
      // Garante registro de Customer vinculado
      await prisma.customer.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      })
    }

    const token = await reply.jwtSign(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId ?? null },
      { expiresIn: '30d' }
    )

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
    }
  })

  // Rotas de negócio
  await fastify.register(clientRoutes,   { prefix: '/api/client' })
  await fastify.register(adminRoutes,    { prefix: '/api/admin' })
  await fastify.register(storeRoutes,    { prefix: '/api/store' })
  await fastify.register(kitchenRoutes,  { prefix: '/api/kitchen' })
  await fastify.register(deliveryRoutes, { prefix: '/api/delivery' })
  await fastify.register(webhookRoutes,  { prefix: '/api/webhooks' })
  await fastify.register(internalRoutes, { prefix: '/api/internal' })

  const port = Number(process.env.PORT ?? 3001)
  await fastify.listen({ port, host: '0.0.0.0' })
  logger.info({ port, env: process.env.NODE_ENV }, 'Foodbio API started')

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
