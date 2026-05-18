import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()

  const { rows: orders } = await pool.query(
    `SELECT
       o.id, o.type, o.status, o.total, o.subtotal, o.discount, o."deliveryFee",
       o."paymentMethod", o."customerName", o."customerPhone", o."createdAt",
       t.number AS "tableNumber"
     FROM "Order" o
     LEFT JOIN "Table" t ON t.id = o."tableId"
     WHERE o."tenantId" = $1
       AND o."createdAt" >= CURRENT_DATE::timestamptz
     ORDER BY o."createdAt" DESC`,
    [session.tenantId]
  )

  const { rows: items } = await pool.query(
    `SELECT oi.id, oi."orderId", p.name, oi.quantity, oi."unitPrice", oi."totalPrice", oi.notes
     FROM "OrderItem" oi
     JOIN "Product" p ON p.id = oi."productId"
     WHERE oi."orderId" = ANY($1)`,
    [orders.map((o: any) => o.id)]
  )

  const ordersWithItems = orders.map((o: any) => ({
    ...o,
    items: items.filter((i: any) => i.orderId === o.id),
  }))

  return NextResponse.json({ orders: ordersWithItems })
}
