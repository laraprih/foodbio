import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getWaiterSession } from '@/lib/waiter-auth'

export const dynamic = 'force-dynamic'

// GET /api/garcom/orders/[id] — detalhes do pedido com itens
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWaiterSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const pool = getPool()

  const { rows } = await pool.query(
    `SELECT
       o.id, o.status, o."paymentStatus", o.total, o.subtotal,
       o."customerName", o."tableId", o."createdAt",
       json_agg(
         json_build_object(
           'id',         oi.id,
           'name',       p.name,
           'quantity',   oi.quantity,
           'unitPrice',  oi."unitPrice",
           'totalPrice', oi."totalPrice",
           'notes',      oi.notes
         ) ORDER BY oi.id
       ) AS items
     FROM "Order" o
     JOIN "OrderItem" oi ON oi."orderId" = o.id
     JOIN "Product" p ON p.id = oi."productId"
     WHERE o.id = $1 AND o."tenantId" = $2
     GROUP BY o.id`,
    [id, session.tenantId]
  )

  if (!rows.length) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  return NextResponse.json({ order: rows[0] })
}
