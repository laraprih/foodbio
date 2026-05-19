import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/session'
import { getPool } from '@/lib/db'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const tenantId = requireAdmin(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const pool = getPool()
  const { rowCount } = await pool.query(
    `UPDATE "User" SET active = false
     WHERE id = $1 AND "tenantId" = $2 AND role != 'admin'`,
    [id, tenantId]
  )

  if (!rowCount) return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
