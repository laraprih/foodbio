import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/session'
import { getPool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const tenantId = requireAdmin(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const pool = getPool()

  const { rows } = await pool.query(
    `UPDATE "Product" SET available = NOT available
     WHERE id = $1 AND "tenantId" = $2
     RETURNING id, available`,
    [id, tenantId]
  )

  if (rows.length === 0) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  return NextResponse.json(rows[0])
}
