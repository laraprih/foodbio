import { FastifyRequest, FastifyReply } from 'fastify'
import prisma from '@/lib/prisma'
import { getCache, setCache } from '@/services/cache.service'

export async function getSummary(request: FastifyRequest, reply: FastifyReply) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const today = new Date().toISOString().slice(0, 10)
  const cacheKey = `report:summary:${tenant.id}:${today}`

  const cached = await getCache(cacheKey)
  if (cached) return cached

  const start = new Date(`${today}T00:00:00Z`)
  const end = new Date(`${today}T23:59:59Z`)

  const [orders, revenue] = await Promise.all([
    prisma.order.count({
      where: { tenantId: tenant.id, createdAt: { gte: start, lte: end } },
    }),
    prisma.order.aggregate({
      where: { tenantId: tenant.id, paymentStatus: 'approved', createdAt: { gte: start, lte: end } },
      _sum: { total: true },
      _avg: { total: true },
    }),
  ])

  const result = {
    ordersToday: orders,
    revenueToday: revenue._sum.total ?? 0,
    avgTicket: revenue._avg.total ?? 0,
  }

  await setCache(cacheKey, result, 300)
  return result
}

export async function getSalesReport(
  request: FastifyRequest<{ Querystring: { from: string; to: string } }>,
  reply: FastifyReply
) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const from = new Date(request.query.from)
  const to = new Date(request.query.to)

  const orders = await prisma.order.findMany({
    where: { tenantId: tenant.id, paymentStatus: 'approved', createdAt: { gte: from, lte: to } },
    include: { items: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0)
  const avgTicket = orders.length ? totalRevenue / orders.length : 0

  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const order of orders) {
    for (const item of order.items) {
      const name = item.product.name
      if (!productMap[item.productId]) productMap[item.productId] = { name, qty: 0, revenue: 0 }
      productMap[item.productId].qty += item.quantity
      productMap[item.productId].revenue += item.totalPrice
    }
  }

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return { totalOrders: orders.length, totalRevenue, avgTicket, topProducts }
}

export async function getSplitReport(
  request: FastifyRequest<{ Querystring: { from: string; to: string; page?: string } }>,
  reply: FastifyReply
) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const from = new Date(request.query.from)
  const to = new Date(request.query.to)
  const page = Math.max(1, Number(request.query.page ?? 1))

  const where = { tenantId: tenant.id, createdAt: { gte: from, lte: to } }

  const [transactions, totals] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * 20,
      take: 20,
      include: { order: { select: { id: true, status: true, createdAt: true } } },
    }),
    prisma.paymentTransaction.aggregate({
      where,
      _sum: { totalAmount: true, marketplaceFee: true, sellerAmount: true },
    }),
  ])

  return {
    transactions,
    summary: {
      totalAmount: totals._sum.totalAmount ?? 0,
      totalFee: totals._sum.marketplaceFee ?? 0,
      totalSeller: totals._sum.sellerAmount ?? 0,
    },
  }
}
