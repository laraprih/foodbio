import { FastifyRequest, FastifyReply } from 'fastify'
import prisma from '@/lib/prisma'
import { emitToOrder, emitToKitchen } from '@/services/socket.service'

export async function listAvailable(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as FastifyRequest & { user: { id: string } }).user

  const driver = await prisma.driver.findUnique({ where: { userId: user.id } })
  if (!driver) return reply.status(404).send({ error: 'Entregador não cadastrado' })

  const orders = await prisma.order.findMany({
    where: {
      tenantId: driver.tenantId,
      status: 'ready',
      delivery: null,
    },
    include: { items: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: 'asc' },
  })

  return orders
}

export async function acceptDelivery(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const user = (request as FastifyRequest & { user: { id: string } }).user
  const driver = await prisma.driver.findUnique({ where: { userId: user.id } })
  if (!driver) return reply.status(404).send({ error: 'Entregador não cadastrado' })

  const order = await prisma.order.findUnique({ where: { id: request.params.id } })
  if (!order || order.tenantId !== driver.tenantId) {
    return reply.status(404).send({ error: 'Pedido não encontrado' })
  }

  const delivery = await prisma.delivery.create({
    data: { orderId: order.id, driverId: driver.id, status: 'assigned' },
  })

  emitToOrder(order.id, 'order:assigned', { orderId: order.id, driverName: driver.userId })
  emitToKitchen(order.tenantId, 'order:assigned', { orderId: order.id })

  return delivery
}

export async function pickupDelivery(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const delivery = await prisma.delivery.update({
    where: { orderId: request.params.id },
    data: { status: 'picked_up', pickupTime: new Date() },
  })

  await prisma.order.update({
    where: { id: request.params.id },
    data: { status: 'dispatched' },
  })

  emitToOrder(request.params.id, 'order:dispatched', { orderId: request.params.id })
  return delivery
}

export async function completeDelivery(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const delivery = await prisma.delivery.update({
    where: { orderId: request.params.id },
    data: { status: 'delivered', deliveryTime: new Date() },
  })

  await prisma.order.update({
    where: { id: request.params.id },
    data: { status: 'delivered' },
  })

  emitToOrder(request.params.id, 'order:delivered', { orderId: request.params.id })
  return delivery
}
