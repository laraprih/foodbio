import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'

const VALID_STATUSES = ['confirmed', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { id } = await params
  const { status, cancelReason } = await req.json()

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `UPDATE "Order"
       SET status = $1, "cancelReason" = $2, "updatedAt" = NOW()
       WHERE id = $3 AND "tenantId" = $4
       RETURNING id, status, "tableId"`,
      [status, cancelReason ?? null, id, session.tenantId]
    )

    if (!rows.length) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    const tableId = rows[0].tableId
    if (tableId && ['delivered', 'cancelled'].includes(status)) {
      const { rows: openOrders } = await client.query(
        `SELECT id FROM "Order"
         WHERE "tableId" = $1 AND status NOT IN ('delivered','cancelled') AND id != $2`,
        [tableId, id]
      )
      if (!openOrders.length) {
        await client.query(
          `UPDATE "Table" SET status = 'free' WHERE id = $1`,
          [tableId]
        )
      }
    }

    await client.query('COMMIT')
    return NextResponse.json({ order: rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[pdv/orders/[id]] error:', err)
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
  } finally {
    client.release()
  }
}
