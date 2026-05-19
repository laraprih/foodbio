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
       o.id, o.type, o.status, o."paymentStatus", o.total, o.subtotal,
       o.discount, o."deliveryFee", o."paymentMethod",
       o."customerName", o."customerPhone",
       o.notes, o."cancelReason", o."waiterName",
       o."tableId", o."cashSessionId",
       o."deliveryAddress",
       o."createdAt", o."updatedAt",
       t.number AS "tableNumber",
       CASE
         WHEN o."waiterName" IS NOT NULL    THEN 'garcom'
         WHEN o."cashSessionId" IS NOT NULL THEN 'pdv'
         ELSE 'online'
       END AS origin
     FROM "Order" o
     LEFT JOIN "Table" t ON t.id = o."tableId"
     WHERE o."tenantId" = $1
       AND o."createdAt" >= CURRENT_DATE::timestamptz
     ORDER BY o."createdAt" DESC`,
    [session.tenantId]
  )

  if (!orders.length) return NextResponse.json({ orders: [] })

  const orderIds = orders.map((o: any) => o.id)

  const [{ rows: items }, { rows: optionRows }] = await Promise.all([
    pool.query(
      `SELECT oi.id, oi."orderId", p.name, oi.quantity,
              oi."unitPrice", oi."totalPrice", oi.notes
       FROM "OrderItem" oi
       JOIN "Product" p ON p.id = oi."productId"
       WHERE oi."orderId" = ANY($1)
       ORDER BY oi.id`,
      [orderIds]
    ),
    pool.query(
      `SELECT oio."orderItemId", oio.name, oio.price
       FROM "OrderItemOption" oio
       JOIN "OrderItem" oi ON oi.id = oio."orderItemId"
       WHERE oi."orderId" = ANY($1)`,
      [orderIds]
    ),
  ])

  const itemsById = new Map<string, any>()
  for (const item of items) {
    itemsById.set(item.id, { ...item, options: [] })
  }
  for (const opt of optionRows) {
    const item = itemsById.get(opt.orderItemId)
    if (item) item.options.push({ name: opt.name, price: opt.price })
  }

  const ordersWithItems = orders.map((o: any) => ({
    ...o,
    items: items
      .filter((i: any) => i.orderId === o.id)
      .map((i: any) => itemsById.get(i.id)),
  }))

  return NextResponse.json({ orders: ordersWithItems })
}
