import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getPool } from '@/lib/db'

async function getSession(req: NextRequest) {
  return getServerSession({ req } as any)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  const tenantId = (session?.user as any)?.tenantId
  if (!tenantId || (session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const pool = getPool()
  const { rowCount } = await pool.query(
    `UPDATE "User" SET active = false
     WHERE id = $1 AND "tenantId" = $2 AND role != 'admin'`,
    [params.id, tenantId]
  )

  if (!rowCount) return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
