import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'
import { serverEmit } from '@/lib/server-emit'

const VALID_METHODS = ['cash', 'pix', 'credit_card', 'debit_card']

// PATCH /api/pdv/orders/[id]/payment — confirma pagamento manual de um pedido
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { paymentMethod, cashSessionId } = body

  if (!VALID_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: 'Método de pagamento inválido' }, { status: 400 })
  }

  const pool = getPool()

  const { rows } = await pool.query(
    `UPDATE "Order"
     SET "paymentStatus" = 'approved',
         "paymentMethod" = $1,
         "cashSessionId" = COALESCE($2, "cashSessionId"),
         "updatedAt"     = NOW()
     WHERE id = $3 AND "tenantId" = $4
     RETURNING id, "paymentStatus", "paymentMethod", status, "tableId", total`,
    [paymentMethod, cashSessionId ?? null, id, session.tenantId]
  )

  if (!rows.length) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  // Libera mesa se pedido de mesa e todos pagos
  const tableId = rows[0].tableId
  if (tableId) {
    const { rows: pending } = await pool.query(
      `SELECT id FROM "Order"
       WHERE "tableId" = $1
         AND "paymentStatus" = 'pending'
         AND status != 'cancelled'
         AND id != $2`,
      [tableId, id]
    )
    if (!pending.length) {
      await pool.query(`UPDATE "Table" SET status = 'free' WHERE id = $1`, [tableId])
    }
  }

  await serverEmit({
    rooms: [`admin:${session.tenantId}`, `kitchen:${session.tenantId}`],
    event: 'order:update',
    data: { orderId: id, paymentStatus: 'approved', paymentMethod },
  })

  return NextResponse.json({ ok: true, order: rows[0] })
}
