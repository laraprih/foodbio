import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getKitchenSession } from '@/lib/kitchen-auth'
import { serverEmit } from '@/lib/server-emit'

const VALID = ['preparing', 'ready', 'dispatched', 'delivered', 'cancelled']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getKitchenSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { id } = await params
  const { status, cancelReason } = await req.json()

  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  // Busca tipo do pedido antes de atualizar
  const { rows: orderRows } = await pool.query(
    `SELECT o.type, o."waiterName", t.number AS "tableNumber"
     FROM "Order" o
     LEFT JOIN "Table" t ON t.id = o."tableId"
     WHERE o.id = $1 AND o."tenantId" = $2`,
    [id, session.tenantId]
  )
  if (!orderRows.length) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  const order = orderRows[0]

  // Pedidos de mesa não podem ser finalizados como "delivered" pela cozinha —
  // encerramento acontece só no checkout do garçom/PDV quando o pagamento é confirmado
  if (order.type === 'in_store' && status === 'delivered') {
    return NextResponse.json(
      { error: 'Pedidos de mesa são encerrados pelo pagamento, não pela cozinha.' },
      { status: 422 }
    )
  }

  const { rows } = await pool.query(
    `UPDATE "Order"
     SET status = $1, "cancelReason" = $2, "updatedAt" = NOW()
     WHERE id = $3 AND "tenantId" = $4
     RETURNING id, status`,
    [status, cancelReason ?? null, id, session.tenantId]
  )

  if (!rows.length) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  // Notifica o garçom quando pedido de mesa fica pronto
  if (order.type === 'in_store' && status === 'ready') {
    await serverEmit({
      rooms: [`garcom:${session.tenantId}`],
      event: 'order_ready_for_table',
      data: {
        orderId: id,
        tableNumber: order.tableNumber,
        waiterName:  order.waiterName,
        message:     `Mesa ${order.tableNumber} está pronta para servir! 🍽️`,
      },
    })
  }

  // Notifica admin e PDV
  await serverEmit({
    rooms: [`admin:${session.tenantId}`, `pdv:${session.tenantId}`],
    event: 'order:update',
    data: { orderId: id, status },
  })

  return NextResponse.json({ order: rows[0] })
}
