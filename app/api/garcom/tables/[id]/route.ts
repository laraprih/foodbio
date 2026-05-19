import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getWaiterSession } from '@/lib/waiter-auth'

export const dynamic = 'force-dynamic'

// GET /api/garcom/tables/[id] — detalhes da mesa + pedidos ativos com itens
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWaiterSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const pool = getPool()

  const { rows: tableRows } = await pool.query(
    `SELECT id, number, capacity, label, status
     FROM "Table"
     WHERE id = $1 AND "tenantId" = $2 AND active = true`,
    [id, session.tenantId]
  )
  if (!tableRows.length) return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 })

  const { rows: orders } = await pool.query(
    `SELECT
       o.id, o.status, o."paymentStatus", o.total, o.subtotal, o.discount,
       o."customerName", o."waiterName", o."createdAt",
       json_agg(
         json_build_object(
           'id',         oi.id,
           'productId',  oi."productId",
           'name',       p.name,
           'quantity',   oi.quantity,
           'unitPrice',  oi."unitPrice",
           'totalPrice', oi."totalPrice",
           'notes',      oi.notes,
           'options', (
             SELECT json_agg(json_build_object('name', oio.name, 'price', oio.price))
             FROM "OrderItemOption" oio WHERE oio."orderItemId" = oi.id
           )
         ) ORDER BY oi.id
       ) AS items
     FROM "Order" o
     JOIN "OrderItem" oi ON oi."orderId" = o.id
     JOIN "Product" p ON p.id = oi."productId"
     WHERE o."tableId" = $1
       AND o."paymentStatus" = 'pending'
       AND o.status != 'cancelled'
     GROUP BY o.id
     ORDER BY o."createdAt" ASC`,
    [id]
  )

  const pendingTotal = orders
    .filter((o: any) => o.paymentStatus === 'pending')
    .reduce((acc: number, o: any) => acc + Number(o.total), 0)

  return NextResponse.json({
    table: tableRows[0],
    orders,
    pendingTotal,
  })
}

// PATCH /api/garcom/tables/[id] — atualizar status da mesa
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWaiterSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status } = body

  const ALLOWED = ['free', 'occupied', 'waiting_payment']
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const pool = getPool()
  const { rowCount } = await pool.query(
    `UPDATE "Table" SET status = $1
     WHERE id = $2 AND "tenantId" = $3 AND active = true`,
    [status, id, session.tenantId]
  )

  if (!rowCount) return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 })
  return NextResponse.json({ ok: true, status })
}
