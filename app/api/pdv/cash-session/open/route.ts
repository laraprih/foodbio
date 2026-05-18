import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()

  // Só uma sessão aberta por tenant
  const { rows: existing } = await pool.query(
    `SELECT id FROM "CashSession" WHERE "tenantId" = $1 AND status = 'open' LIMIT 1`,
    [session.tenantId]
  )
  if (existing.length) {
    return NextResponse.json({ error: 'Já existe um caixa aberto para esta empresa' }, { status: 409 })
  }

  const { initialAmount } = await req.json()
  if (typeof initialAmount !== 'number' || initialAmount < 0) {
    return NextResponse.json({ error: 'Valor inicial inválido' }, { status: 400 })
  }

  const id = randomUUID()
  const { rows } = await pool.query(
    `INSERT INTO "CashSession" (id, "tenantId", "operatorId", "initialAmount", status)
     VALUES ($1, $2, $3, $4, 'open')
     RETURNING *`,
    [id, session.tenantId, session.id, initialAmount]
  )

  return NextResponse.json({ session: rows[0] }, { status: 201 })
}
