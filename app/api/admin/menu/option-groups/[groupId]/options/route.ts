import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function getAdminTenant(session: unknown): string | null {
  const user = (session as { user?: { role?: string; tenantId?: string } } | null)?.user
  if (!user || user.role !== 'admin' || !user.tenantId) return null
  return user.tenantId
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth()
  const tenantId = getAdminTenant(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { groupId } = await params
  const pool = getPool()

  // Verify group ownership via product → tenant
  const { rows: ownerRows } = await pool.query(
    `SELECT og.id
     FROM "OptionGroup" og
     JOIN "Product" p ON p.id = og."productId"
     WHERE og.id = $1 AND p."tenantId" = $2`,
    [groupId, tenantId]
  )
  if (ownerRows.length === 0) {
    return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
  }

  const body = await req.json()
  const { name, priceModifier = 0, available = true } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const { rows } = await pool.query(
    `INSERT INTO "Option" (id, "groupId", name, "priceModifier", available)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, "groupId", name, "priceModifier", available`,
    [id, groupId, name.trim(), Number(priceModifier), available]
  )

  return NextResponse.json(rows[0], { status: 201 })
}
