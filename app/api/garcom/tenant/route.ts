import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getWaiterSession } from '@/lib/waiter-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getWaiterSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT name, "logoUrl", "logoFormat" FROM "Tenant" WHERE id = $1`,
    [session.tenantId]
  )

  if (!rows.length) return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })

  return NextResponse.json({ tenant: rows[0] })
}
