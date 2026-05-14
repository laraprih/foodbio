import { FastifyInstance } from 'fastify'
import prisma from '@/lib/prisma'
import { requireCook } from '@/middlewares/auth.middleware'
import { updateOrderStatus } from '@/controllers/order.controller'

export async function kitchenRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireCook)

  fastify.get('/orders', async (request: any) => {
    const { tenantId } = request.user
    return prisma.order.findMany({
      where: {
        tenantId,
        status: { in: ['confirmed', 'preparing', 'ready'] },
      },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            options: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  })

  fastify.patch('/orders/:id/start', (req: any, reply: any) => {
    req.body = { status: 'preparing' }
    return updateOrderStatus(req, reply)
  })

  fastify.patch('/orders/:id/ready', (req: any, reply: any) => {
    req.body = { status: 'ready' }
    return updateOrderStatus(req, reply)
  })
}
