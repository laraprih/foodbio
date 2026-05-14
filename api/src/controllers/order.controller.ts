import { FastifyRequest, FastifyReply } from 'fastify'
import prisma from '@/lib/prisma'
import { paymentQueue } from '@/queue/index'
import { emitToKitchen, emitToAdmin, emitToOrder } from '@/services/socket.service'

interface CreateOrderBody {
  restaurantId: string
  items: Array<{ productId: string; quantity: number; options?: string[]; notes?: string }>
  type?: string
  deliveryAddress?: Record<string, unknown>
  customerName?: string
  customerPhone?: string
  notes?: string
}

export async function createOrder(
  request: FastifyRequest<{ Body: CreateOrderBody }>,
  reply: FastifyReply
) {
  const { restaurantId, items, type = 'delivery', deliveryAddress, customerName, customerPhone, notes } = request.body

  const tenant = await prisma.tenant.findUnique({ where: { id: restaurantId } })
  if (!tenant || !tenant.active) {
    return reply.status(404).send({ error: 'Restaurante não encontrado ou inativo' })
  }

  let subtotal = 0
  const orderItems: {
    productId: string
    quantity: number
    unitPrice: number
    totalPrice: number
    notes?: string
    options?: { create: Array<{ optionId: string; name: string; price: number }> }
  }[] = []

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId, tenantId: restaurantId },
      include: { optionGroups: { include: { options: true } } },
    })

    if (!product || !product.available) {
      return reply.status(400).send({ error: `Produto "${item.productId}" não encontrado ou indisponível` })
    }

    let unitPrice = product.price
    const selectedOptions: Array<{ optionId: string; name: string; price: number }> = []

    if (item.options?.length) {
      const allOptions = product.optionGroups.flatMap((g) => g.options)
      for (const optId of item.options) {
        const opt = allOptions.find((o) => o.id === optId)
        if (opt) {
          unitPrice += opt.priceModifier
          selectedOptions.push({ optionId: opt.id, name: opt.name, price: opt.priceModifier })
        }
      }
    }

    const totalPrice = unitPrice * item.quantity
    subtotal += totalPrice

    orderItems.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      notes: item.notes,
      ...(selectedOptions.length ? { options: { create: selectedOptions } } : {}),
    })
  }

  const deliveryFee = type === 'delivery' ? tenant.deliveryFee : 0
  const total = subtotal + deliveryFee

  const order = await prisma.order.create({
    data: {
      tenantId: restaurantId,
      type,
      subtotal,
      deliveryFee,
      total,
      deliveryAddress,
      customerName,
      customerPhone,
      notes,
      items: { create: orderItems },
    },
    include: { items: true },
  })

  return reply.status(201).send({ orderId: order.id, total: order.total })
}

export async function payOrder(
  request: FastifyRequest<{ Params: { id: string }; Body: { token: string; gateway: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params
  const { token, gateway } = request.body

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) return reply.status(404).send({ error: 'Pedido não encontrado' })

  if (order.paymentStatus !== 'pending') {
    return reply.status(409).send({ error: 'Pedido já foi processado' })
  }

  await paymentQueue.add(
    'process',
    { orderId: id, token, gateway },
    { priority: 1, jobId: `pay-${id}` } // jobId evita duplicatas
  )

  return reply.status(202).send({ status: 'processing', message: 'Pagamento em processamento' })
}

export async function getOrder(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const order = await prisma.order.findUnique({
    where: { id: request.params.id },
    include: {
      items: { include: { options: true } },
      delivery: true,
    },
  })

  if (!order) return reply.status(404).send({ error: 'Pedido não encontrado' })

  // Não expor payload de pagamento
  const { ...safe } = order
  return safe
}

export async function listAdminOrders(
  request: FastifyRequest<{ Querystring: { status?: string; page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const page = Math.max(1, Number(request.query.page ?? 1))
  const limit = Math.min(50, Number(request.query.limit ?? 20))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { tenantId: tenant.id }
  if (request.query.status) where.status = request.query.status

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { items: { include: { product: { select: { name: true } } } } },
    }),
    prisma.order.count({ where }),
  ])

  return { orders, total, page, pages: Math.ceil(total / limit) }
}

export async function updateOrderStatus(
  request: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>,
  reply: FastifyReply
) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const validTransitions: Record<string, string> = {
    confirmed: 'preparing',
    preparing: 'ready',
  }

  const order = await prisma.order.findUnique({ where: { id: request.params.id, tenantId: tenant.id } })
  if (!order) return reply.status(404).send({ error: 'Pedido não encontrado' })

  const nextStatus = validTransitions[order.status]
  if (!nextStatus || nextStatus !== request.body.status) {
    return reply.status(400).send({ error: `Transição de status inválida: ${order.status} → ${request.body.status}` })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: nextStatus },
  })

  emitToOrder(order.id, 'order:update', { orderId: order.id, status: nextStatus, updatedAt: updated.updatedAt })

  if (nextStatus === 'ready') {
    emitToDrivers(tenant.id, 'order:ready', { orderId: order.id })
  }

  return updated
}

export async function cancelOrder(
  request: FastifyRequest<{ Params: { id: string }; Body: { reason?: string } }>,
  reply: FastifyReply
) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const order = await prisma.order.findUnique({ where: { id: request.params.id, tenantId: tenant.id } })

  if (!order) return reply.status(404).send({ error: 'Pedido não encontrado' })
  if (!['pending', 'confirmed'].includes(order.status)) {
    return reply.status(400).send({ error: 'Pedido não pode ser cancelado no status atual' })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'cancelled', cancelReason: request.body.reason },
  })

  emitToOrder(order.id, 'order:update', { orderId: order.id, status: 'cancelled' })
  return updated
}

function emitToDrivers(tenantId: string, event: string, data: unknown) {
  try {
    const { emitToDrivers: emit } = require('@/services/socket.service')
    emit(tenantId, event, data)
  } catch { /* */ }
}
