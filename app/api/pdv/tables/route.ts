import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()

  const { rows } = await pool.query(
    `SELECT t.id, t.number, t.capacity, t.label, t.status,
            COUNT(o.id) FILTER (WHERE o.status NOT IN ('delivered','cancelled')) AS open_orders,
            MAX(o."customerName") AS last_customer
     FROM "Table" t
     LEFT JOIN "Order" o ON o."tableId" = t.id
     WHERE t."tenantId" = $1 AND t.active = true
     GROUP BY t.id
     ORDER BY t.number ASC`,
    [session.tenantId]
  )

  return NextResponse.json({ tables: rows })
}

export async function POST(req: NextRequest) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { number, capacity, label } = await req.json()

  if (!number || typeof number !== 'number') {
    return NextResponse.json({ error: 'Número da mesa obrigatório' }, { status: 400 })
  }

  const id = randomUUID()
  try {
    const { rows } = await pool.query(
      `INSERT INTO "Table" (id, "tenantId", number, capacity, label)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, session.tenantId, number, capacity ?? 4, label ?? null]
    )
    return NextResponse.json({ table: rows[0] }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Número de mesa já existe' }, { status: 409 })
  }
}
