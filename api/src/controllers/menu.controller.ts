import { FastifyRequest, FastifyReply } from 'fastify'
import prisma from '@/lib/prisma'
import { getMenu, invalidateMenu, getTenant } from '@/services/cache.service'

export async function getMenuBySlug(
  request: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply
) {
  const tenant = await getTenant(request.params.slug)
  if (!tenant) return reply.status(404).send({ error: 'Restaurante não encontrado' })

  const categories = await getMenu(tenant.id)
  return {
    restaurant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logoUrl,
      address: tenant.address,
      deliveryFee: tenant.deliveryFee,
      minOrderValue: tenant.minOrderValue,
      openingHours: tenant.openingHours,
      gateway: (tenant as Record<string, unknown>).paymentAccount
        ? ((tenant as Record<string, unknown>).paymentAccount as Record<string, unknown>).gateway
        : null,
    },
    categories,
  }
}

export async function getProduct(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const product = await prisma.product.findUnique({
    where: { id: request.params.id },
    include: { optionGroups: { include: { options: { where: { available: true } } } } },
  })
  if (!product) return reply.status(404).send({ error: 'Produto não encontrado' })
  return product
}

export async function createCategory(
  request: FastifyRequest<{ Body: { name: string; order?: number } }>,
  reply: FastifyReply
) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const category = await prisma.category.create({
    data: { tenantId: tenant.id, name: request.body.name, order: request.body.order ?? 0 },
  })
  await invalidateMenu(tenant.id)
  return reply.status(201).send(category)
}

export async function updateCategory(
  request: FastifyRequest<{ Params: { id: string }; Body: { name?: string; order?: number; active?: boolean } }>,
  reply: FastifyReply
) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const category = await prisma.category.update({
    where: { id: request.params.id, tenantId: tenant.id },
    data: request.body,
  })
  await invalidateMenu(tenant.id)
  return category
}

export async function createProduct(
  request: FastifyRequest<{ Body: { name: string; description?: string; price: number; categoryId: string; imageUrl?: string } }>,
  reply: FastifyReply
) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const product = await prisma.product.create({
    data: { ...request.body, tenantId: tenant.id },
  })
  await invalidateMenu(tenant.id)
  return reply.status(201).send(product)
}

export async function updateProduct(
  request: FastifyRequest<{ Params: { id: string }; Body: Record<string, unknown> }>,
  reply: FastifyReply
) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const product = await prisma.product.update({
    where: { id: request.params.id, tenantId: tenant.id },
    data: request.body,
  })
  await invalidateMenu(tenant.id)
  return product
}

export async function toggleAvailability(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const current = await prisma.product.findUnique({ where: { id: request.params.id } })
  if (!current) return reply.status(404).send({ error: 'Produto não encontrado' })

  const product = await prisma.product.update({
    where: { id: request.params.id, tenantId: tenant.id },
    data: { available: !current.available },
  })
  await invalidateMenu(tenant.id)
  return product
}
