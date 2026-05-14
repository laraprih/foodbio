import { FastifyInstance } from 'fastify';
import prisma from '@/lib/prisma';

export async function adminRoutes(fastify: FastifyInstance) {
  // Get all orders for a tenant
  fastify.get('/orders', async (request: any, reply) => {
    const { tenantId } = request.query;
    return prisma.order.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  // Update order status
  fastify.patch('/orders/:id/status', async (request: any, reply) => {
    const { id } = request.params;
    const { status } = request.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return order;
  });

  // Dashboard metrics
  fastify.get('/metrics', async (request: any, reply) => {
    const { tenantId } = request.query;
    const orders = await prisma.order.findMany({ where: { tenantId } });
    
    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
    const orderCount = orders.length;

    return { totalRevenue, orderCount };
  });
}
