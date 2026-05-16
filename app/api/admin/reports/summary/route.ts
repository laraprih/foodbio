import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

function getTenantId(session: any): string | null {
  const user = session?.user as any
  if (!user || user.role !== 'admin' || !user.tenantId) return null
  return user.tenantId
}

export async function GET() {
  const session = await auth()
  const tenantId = getTenantId(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [ordersRes, txRes, paymentAccountRes, customersRes] = await Promise.all([
    pool.query(
      `SELECT status, total FROM "Order"
       WHERE "tenantId" = $1 AND status NOT IN ('cancelled')`,
      [tenantId]
    ),
    pool.query(
      `SELECT "totalAmount", "marketplaceFee", "sellerAmount", "splitStatus"
       FROM "PaymentTransaction" WHERE "tenantId" = $1`,
      [tenantId]
    ),
    pool.query(
      `SELECT gateway FROM "TenantPaymentAccount" WHERE "tenantId" = $1 LIMIT 1`,
      [tenantId]
    ),
    pool.query(
      `SELECT COUNT(DISTINCT "customerPhone") AS count
       FROM "Order"
       WHERE "tenantId" = $1 AND "createdAt" >= $2`,
      [tenantId, today.toISOString()]
    ),
  ])

  const orders = ordersRes.rows
  const transactions = txRes.rows
  const gateway = paymentAccountRes.rows[0]?.gateway ?? null

  const totalRevenue = transactions.reduce((s, t) => s + (t.totalAmount ?? 0), 0)
  const totalFees = transactions.reduce((s, t) => s + (t.marketplaceFee ?? 0), 0)
  const totalPayout = totalRevenue - totalFees

  const pendingCount = transactions.filter((t) => t.splitStatus === 'pending').length
  const approvedCount = transactions.filter((t) => t.splitStatus === 'done').length
  const refundedCount = transactions.filter((t) => t.splitStatus === 'refunded').length

  const todayOrders = orders.filter((o) => {
    // We use the full orders query without date filter for totals,
    // but orderCount should reflect today's orders
    return true
  })

  const orderCount = orders.length
  const newCustomers = Number(customersRes.rows[0]?.count ?? 0)

  return NextResponse.json({
    totalRevenue,
    totalFees,
    totalPayout,
    orderCount,
    averageTicket: orderCount > 0 ? totalRevenue / orderCount : 0,
    newCustomers,
    pendingCount,
    approvedCount,
    refundedCount,
    gateway,
    connected: !!gateway,
  })
}
