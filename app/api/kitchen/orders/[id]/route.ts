import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getKitchenSession } from '@/lib/kitchen-auth'

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

  const { rows } = await pool.query(
    `UPDATE "Order"
     SET status = $1, "cancelReason" = $2, "updatedAt" = NOW()
     WHERE id = $3 AND "tenantId" = $4
     RETURNING id, status`,
    [status, cancelReason ?? null, id, session.tenantId]
  )

  if (!rows.length) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  return NextResponse.json({ order: rows[0] })
}
