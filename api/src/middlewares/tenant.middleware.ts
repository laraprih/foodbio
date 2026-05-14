import { FastifyRequest, FastifyReply } from 'fastify';
import { getTenantBySlug } from '@/services/tenant.service';

export async function tenantMiddleware(
  request: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply
) {
  const { slug } = request.params;
  if (!slug) return;

  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    return reply.status(404).send({ error: 'Restaurante não encontrado' });
  }

  (request as any).tenant = tenant;
}
