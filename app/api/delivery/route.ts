import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  const user = session?.user as any
  if (!user || user.role !== 'driver') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const pool = getPool()

  const driverRes = await pool.query(
    `SELECT id FROM "Driver" WHERE "userId" = $1 AND active = true`,
    [user.id]
  )
  if (!driverRes.rows.length) {
    return NextResponse.json({ error: 'Entregador não encontrado' }, { status: 404 })
  }
  const driverId = driverRes.rows[0].id

  const { rows } = await pool.query(
    `SELECT
       d.id, d.status, d."estimatedMin" AS "estimatedMinutes", d."createdAt",
       o.id AS "orderId", o.total, o."customerName", o."customerPhone",
       o."deliveryAddress", o."createdAt" AS "orderCreatedAt",
       json_agg(
         json_build_object(
           'quantity', oi.quantity,
           'product', json_build_object('name', p.name)
         )
       ) AS items
     FROM "Delivery" d
     JOIN "Order" o ON o.id = d."orderId"
     LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
     LEFT JOIN "Product" p ON p.id = oi."productId"
     WHERE d."driverId" = $1
       AND d.status != 'delivered'
     GROUP BY d.id, o.id
     ORDER BY d."createdAt" DESC
     LIMIT 20`,
    [driverId]
  )

  const deliveries = rows.map((r: any) => ({
    id: r.id,
    status: r.status,
    estimatedMinutes: r.estimatedMinutes,
    createdAt: r.createdAt,
    order: {
      id: r.orderId,
      total: r.total,
      items: r.items ?? [],
      customer: { name: r.customerName, phone: r.customerPhone },
      address: r.deliveryAddress ? (typeof r.deliveryAddress === 'string' ? JSON.parse(r.deliveryAddress) : r.deliveryAddress) : null,
    },
  }))

  return NextResponse.json(deliveries)
}
