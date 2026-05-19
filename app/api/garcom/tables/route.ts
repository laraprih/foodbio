import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getWaiterSession } from '@/lib/waiter-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getWaiterSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()

  const { rows } = await pool.query(
    `SELECT
       t.id, t.number, t.capacity, t.label, t.status,
       COUNT(o.id) FILTER (
         WHERE o.status NOT IN ('delivered','cancelled')
       ) AS open_orders,
       COALESCE(
         SUM(o.total) FILTER (
           WHERE o.status NOT IN ('delivered','cancelled')
                 AND o."paymentStatus" = 'pending'
         ), 0
       ) AS pending_total
     FROM "Table" t
     LEFT JOIN "Order" o ON o."tableId" = t.id
     WHERE t."tenantId" = $1 AND t.active = true
     GROUP BY t.id
     ORDER BY t.number ASC`,
    [session.tenantId]
  )

  return NextResponse.json({ tables: rows })
}
