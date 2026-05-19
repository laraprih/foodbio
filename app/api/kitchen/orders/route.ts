import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getKitchenSession } from '@/lib/kitchen-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getKitchenSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { tenantId } = session
  const origin = req.nextUrl.searchParams.get('origin') ?? 'all' // all | online | pdv

  const originFilter =
    origin === 'online' ? `AND o."cashSessionId" IS NULL` :
    origin === 'pdv'    ? `AND o."cashSessionId" IS NOT NULL` :
    ''

  const { rows: orders } = await pool.query(
    `SELECT
       o.id, o.status, o.type, o.total, o.subtotal, o."deliveryFee",
       o."paymentMethod", o."customerName", o."customerPhone",
       o."deliveryAddress", o."createdAt", o."updatedAt",
       o."cashSessionId", o."tableId", o."waiterName",
       tab.number AS "tableNumber",
       CASE WHEN o."cashSessionId" IS NOT NULL THEN 'pdv' ELSE 'online' END AS origin
     FROM "Order" o
     LEFT JOIN "Table" tab ON tab.id = o."tableId"
     WHERE o."tenantId" = $1
       AND o.status IN ('confirmed', 'preparing', 'ready')
       AND o."createdAt" >= CURRENT_DATE::timestamptz
       ${originFilter}
     ORDER BY o."createdAt" ASC`,
    [tenantId]
  )

  if (!orders.length) return NextResponse.json([])

  const orderIds = orders.map((o: any) => o.id)

  const [{ rows: items }, { rows: optionRows }] = await Promise.all([
    pool.query(
      `SELECT oi.id, oi."orderId", oi.quantity, oi."unitPrice", oi.notes, p.name
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

  const itemsMap = new Map<string, any[]>()
  for (const item of items) {
    const list = itemsMap.get(item.orderId) ?? []
    list.push({
      ...item,
      options: optionRows.filter((o: any) => o.orderItemId === item.id),
    })
    itemsMap.set(item.orderId, list)
  }

  return NextResponse.json(
    orders.map((o: any) => ({ ...o, items: itemsMap.get(o.id) ?? [] }))
  )
}
