import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { sessionId, type, amount, reason } = await req.json()

  if (!sessionId || !['bleed', 'supply'].includes(type) || !amount || amount <= 0 || !reason?.trim()) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // Verifica que a sessão pertence ao tenant
  const { rows: sessionRows } = await pool.query(
    `SELECT id FROM "CashSession" WHERE id = $1 AND "tenantId" = $2 AND status = 'open'`,
    [sessionId, session.tenantId]
  )
  if (!sessionRows.length) {
    return NextResponse.json({ error: 'Sessão não encontrada ou já fechada' }, { status: 404 })
  }

  const id = randomUUID()
  const { rows } = await pool.query(
    `INSERT INTO "CashMovement" (id, "sessionId", type, amount, reason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, sessionId, type, amount, reason.trim()]
  )

  return NextResponse.json({ movement: rows[0] }, { status: 201 })
}
