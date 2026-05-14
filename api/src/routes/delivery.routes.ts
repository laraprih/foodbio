import { FastifyInstance } from 'fastify'
import { requireDriver } from '@/middlewares/auth.middleware'
import * as delivery from '@/controllers/delivery.controller'

export async function deliveryRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireDriver)

  fastify.get('/available', delivery.listAvailable)
  fastify.post('/orders/:id/accept', delivery.acceptDelivery)
  fastify.post('/orders/:id/pickup', delivery.pickupDelivery)
  fastify.post('/orders/:id/deliver', delivery.completeDelivery)
}
