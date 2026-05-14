import { FastifyInstance } from 'fastify';
import { getTenantBySlug, getTenantMenu } from '@/services/tenant.service';
import prisma from '@/lib/prisma';

export async function storeRoutes(fastify: FastifyInstance) {
  // Get tenant info
  fastify.get('/:slug', async (request: any, reply) => {
    const { slug } = request.params;
    const tenant = await getTenantBySlug(slug);
    if (!tenant) return reply.status(404).send({ error: 'Restaurante não encontrado' });
    return tenant;
  });

  // Get tenant menu
  fastify.get('/:slug/menu', async (request: any, reply) => {
    const { slug } = request.params;
    const tenant = await getTenantBySlug(slug);
    if (!tenant) return reply.status(404).send({ error: 'Restaurante não encontrado' });
    
    return getTenantMenu(tenant.id);
  });

  // Get product details
  fastify.get('/:slug/products/:id', async (request: any, reply) => {
    const { id } = request.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { optionGroups: { include: { options: true } } },
    });

    if (!product) return reply.status(404).send({ error: 'Produto não encontrado' });
    return product;
  });
}
