import { FastifyInstance } from 'fastify';
import { createOrder, getOrderById } from '@/services/order.service';

export async function clientRoutes(fastify: FastifyInstance) {
  // Create Order
  fastify.post('/orders', async (request: any, reply) => {
    try {
      const order = await createOrder(request.body);
      return { orderId: order.id };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Get Order Status
  fastify.get('/orders/:id', async (request: any, reply) => {
    const { id } = request.params;
    const order = await getOrderById(id);
    if (!order) return reply.status(404).send({ error: 'Pedido não encontrado' });
    return order;
  });

  // Pay Order
  fastify.post('/orders/:id/pay', async (request: any, reply) => {
    const { id } = request.params;
    // For now, just mark as confirmed for testing
    // In real implementation, this triggers payment service
    return { success: true };
  });
}
