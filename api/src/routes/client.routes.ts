import { FastifyInstance } from 'fastify';
import { createOrder, payOrder, getOrder } from '@/controllers/order.controller';

export async function clientRoutes(fastify: FastifyInstance) {
  // Create Order — mapeia campos do frontend para o controller
  fastify.post('/orders', async (request: any, reply) => {
    // Frontend envia deliveryType/address; controller espera type/deliveryAddress
    const body = request.body ?? {};
    request.body = {
      ...body,
      type: body.deliveryType ?? body.type ?? 'delivery',
      deliveryAddress: body.address ?? body.deliveryAddress,
    };
    return createOrder(request, reply);
  });

  // Get Order
  fastify.get('/orders/:id', async (request: any, reply) => {
    return getOrder(request, reply);
  });

  // Pay Order
  fastify.post('/orders/:id/pay', async (request: any, reply) => {
    return payOrder(request, reply);
  });
}
