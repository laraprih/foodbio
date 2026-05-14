import { FastifyInstance } from 'fastify'
import { handleWebhookMP, handleWebhookPB } from '@/controllers/payment.controller'

export async function webhookRoutes(fastify: FastifyInstance) {
  // Webhooks não usam JWT — autenticados por HMAC da assinatura do gateway
  fastify.post('/payment/mercadopago', handleWebhookMP)
  fastify.post('/payment/pagbank', handleWebhookPB)
}
