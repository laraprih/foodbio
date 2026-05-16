import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

function getTenantId(session: any): string | null {
  const user = session?.user as any
  if (!user || user.role !== 'admin' || !user.tenantId) return null
  return user.tenantId
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const tenantId = getTenantId(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? '30d'

  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const pool = getPool()

  const [ordersRes, itemsRes] = await Promise.all([
    pool.query(
      `SELECT id, total, "createdAt"
       FROM "Order"
       WHERE "tenantId" = $1
         AND status NOT IN ('cancelled')
         AND "createdAt" >= $2
       ORDER BY "createdAt" ASC`,
      [tenantId, since.toISOString()]
    ),
    pool.query(
      `SELECT oi.quantity, oi."totalPrice", p.name
       FROM "OrderItem" oi
       JOIN "Order" o ON o.id = oi."orderId"
       JOIN "Product" p ON p.id = oi."productId"
       WHERE o."tenantId" = $1
         AND o.status NOT IN ('cancelled')
         AND o."createdAt" >= $2`,
      [tenantId, since.toISOString()]
    ),
  ])

  const orders = ordersRes.rows
  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total ?? 0), 0)
  const orderCount = orders.length
  const averageTicket = orderCount > 0 ? totalRevenue / orderCount : 0

  // Group by day
  const byDayMap: Record<string, { revenue: number; orders: number }> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    byDayMap[key] = { revenue: 0, orders: 0 }
  }
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10)
    if (byDayMap[key]) {
      byDayMap[key].revenue += o.total ?? 0
      byDayMap[key].orders += 1
    }
  }
  const byDay = Object.entries(byDayMap).map(([date, v]) => ({ date, ...v }))

  // Top products
  const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {}
  for (const item of itemsRes.rows) {
    if (!productMap[item.name]) productMap[item.name] = { name: item.name, quantity: 0, revenue: 0 }
    productMap[item.name].quantity += item.quantity
    productMap[item.name].revenue += item.totalPrice ?? 0
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  return NextResponse.json({
    period,
    totalRevenue,
    orderCount,
    averageTicket,
    topProducts,
    byDay,
  })
}
