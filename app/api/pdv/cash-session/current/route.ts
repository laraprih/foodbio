import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()

  const { rows } = await pool.query(
    `SELECT cs.*, u.name AS "operatorName"
     FROM "CashSession" cs
     JOIN "User" u ON u.id = cs."operatorId"
     WHERE cs."tenantId" = $1 AND cs.status = 'open'
     ORDER BY cs."openedAt" DESC
     LIMIT 1`,
    [session.tenantId]
  )

  return NextResponse.json({ session: rows[0] ?? null })
}
