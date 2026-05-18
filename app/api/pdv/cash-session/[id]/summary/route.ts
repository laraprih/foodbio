import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { id } = params

  const [{ rows: sessionRows }, { rows: orderRows }, { rows: movementRows }] = await Promise.all([
    pool.query(
      `SELECT cs.*, u.name AS "operatorName"
       FROM "CashSession" cs
       JOIN "User" u ON u.id = cs."operatorId"
       WHERE cs.id = $1 AND cs."tenantId" = $2`,
      [id, session.tenantId]
    ),
    pool.query(
      `SELECT o."paymentMethod", o.total, o.discount, o.status
       FROM "Order" o
       WHERE o."cashSessionId" = $1`,
      [id]
    ),
    pool.query(
      `SELECT type, amount, reason, "createdAt"
       FROM "CashMovement"
       WHERE "sessionId" = $1
       ORDER BY "createdAt" ASC`,
      [id]
    ),
  ])

  if (!sessionRows.length) {
    return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
  }

  const activeOrders = orderRows.filter((o: any) => o.status !== 'cancelled')
  const cancelled = orderRows.filter((o: any) => o.status === 'cancelled').length

  const byMethod: Record<string, number> = {}
  let grossTotal = 0
  let totalDiscounts = 0

  for (const o of activeOrders) {
    const method = o.paymentMethod ?? 'outro'
    byMethod[method] = (byMethod[method] ?? 0) + Number(o.total)
    grossTotal += Number(o.total)
    totalDiscounts += Number(o.discount ?? 0)
  }

  const bleeds = movementRows
    .filter((m: any) => m.type === 'bleed')
    .reduce((s: number, m: any) => s + Number(m.amount), 0)

  const supplies = movementRows
    .filter((m: any) => m.type === 'supply')
    .reduce((s: number, m: any) => s + Number(m.amount), 0)

  const cashSales = byMethod['cash'] ?? 0
  const expectedCash =
    Number(sessionRows[0].initialAmount) + cashSales + supplies - bleeds

  return NextResponse.json({
    session: sessionRows[0],
    orders: activeOrders.length,
    cancelled,
    byMethod,
    grossTotal,
    discounts: totalDiscounts,
    netTotal: grossTotal - totalDiscounts,
    bleeds,
    supplies,
    expectedCash,
    movements: movementRows,
  })
}
