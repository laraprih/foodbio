import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'

export async function POST(req: NextRequest) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { sessionId, closeAmount } = await req.json()

  if (!sessionId || typeof closeAmount !== 'number' || closeAmount < 0) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { rows } = await pool.query(
    `UPDATE "CashSession"
     SET status = 'closed', "closedAt" = NOW(), "closeAmount" = $1
     WHERE id = $2 AND "tenantId" = $3 AND status = 'open'
     RETURNING *`,
    [closeAmount, sessionId, session.tenantId]
  )

  if (!rows.length) {
    return NextResponse.json({ error: 'Sessão não encontrada ou já fechada' }, { status: 404 })
  }

  return NextResponse.json({ session: rows[0] })
}
