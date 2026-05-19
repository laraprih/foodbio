import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireStaff } from '@/lib/session'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const tenantId = requireStaff(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const from = searchParams.get('from') ?? todayISO()
  const to   = searchParams.get('to')   ?? todayISO()

  const pool = getPool()

  const { rows: orders } = await pool.query(
    `SELECT o.id, o.status, o.type, o.total, o.subtotal, o."deliveryFee",
            o."paymentStatus", o."paymentMethod", o."customerName", o."customerPhone",
            o."deliveryAddress", o."externalReference", o."createdAt", o."updatedAt",
            o."cashSessionId", o."tableId",
            tab.number AS "tableNumber",
            CASE WHEN o."cashSessionId" IS NOT NULL THEN 'pdv' ELSE 'online' END AS origin
     FROM "Order" o
     LEFT JOIN "Table" tab ON tab.id = o."tableId"
     WHERE o."tenantId" = $1
       AND o."createdAt" >= ($2::date)
       AND o."createdAt" <  ($3::date + interval '1 day')
     ORDER BY o."createdAt" DESC
     LIMIT 500`,
    [tenantId, from, to]
  )

  const orderIds = orders.map((o) => o.id)
  let itemsByOrder: Record<string, any[]> = {}

  if (orderIds.length) {
    const { rows: items } = await pool.query(
      `SELECT oi."orderId", oi.id, oi."productId", oi.quantity, oi."unitPrice" AS price,
              p.name AS product_name
       FROM "OrderItem" oi
       JOIN "Product" p ON p.id = oi."productId"
       WHERE oi."orderId" = ANY($1)`,
      [orderIds]
    )
    for (const item of items) {
      if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = []
      itemsByOrder[item.orderId].push({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        product: { name: item.product_name },
      })
    }
  }

  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      status: o.status,
      type: o.type,
      total: o.total,
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      address: o.deliveryAddress,
      externalReference: o.externalReference,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      cashSessionId: o.cashSessionId,
      tableNumber: o.tableNumber ?? null,
      origin: o.origin,
      items: itemsByOrder[o.id] ?? [],
    }))
  )
}
