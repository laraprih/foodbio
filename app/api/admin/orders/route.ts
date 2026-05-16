import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

function getTenantId(session: any): string | null {
  const user = session?.user as any
  if (!user || !['admin', 'attendant', 'cook'].includes(user.role) || !user.tenantId) return null
  return user.tenantId
}

export async function GET() {
  const session = await auth()
  const tenantId = getTenantId(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()

  const { rows: orders } = await pool.query(
    `SELECT o.id, o.status, o.type, o.total, o.subtotal, o."deliveryFee",
            o."paymentStatus", o."paymentMethod", o."customerName", o."customerPhone",
            o."deliveryAddress", o."externalReference", o."createdAt", o."updatedAt"
     FROM "Order" o
     WHERE o."tenantId" = $1
     ORDER BY o."createdAt" DESC
     LIMIT 200`,
    [tenantId]
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
      items: itemsByOrder[o.id] ?? [],
    }))
  )
}
