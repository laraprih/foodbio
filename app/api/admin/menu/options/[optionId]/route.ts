import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/session'
import { getPool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import type { Pool } from 'pg'

function getAdminTenant(session: unknown): string | null {
  const user = (session as { user?: { role?: string; tenantId?: string } } | null)?.user
  if (!user || user.role !== 'admin' || !user.tenantId) return null
  return user.tenantId
}

async function verifyOptionOwnership(
  pool: Pool,
  optionId: string,
  tenantId: string
): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT o.id
     FROM "Option" o
     JOIN "OptionGroup" og ON og.id = o."groupId"
     JOIN "Product" p ON p.id = og."productId"
     WHERE o.id = $1 AND p."tenantId" = $2`,
    [optionId, tenantId]
  )
  return rows.length > 0
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ optionId: string }> }
) {
  const session = await auth()
  const tenantId = requireAdmin(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { optionId } = await params
  const pool = getPool()

  const owned = await verifyOptionOwnership(pool, optionId, tenantId)
  if (!owned) return NextResponse.json({ error: 'Opção não encontrada' }, { status: 404 })

  const body = await req.json()
  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (body.name !== undefined) { fields.push(`name = $${idx}`); values.push(body.name); idx++ }
  if (body.priceModifier !== undefined) { fields.push(`"priceModifier" = $${idx}`); values.push(Number(body.priceModifier)); idx++ }
  if (body.available !== undefined) { fields.push(`available = $${idx}`); values.push(body.available); idx++ }

  if (fields.length === 0) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })

  values.push(optionId)
  const { rows } = await pool.query(
    `UPDATE "Option" SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, "groupId", name, "priceModifier", available`,
    values
  )

  return NextResponse.json(rows[0])
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ optionId: string }> }
) {
  const session = await auth()
  const tenantId = requireAdmin(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { optionId } = await params
  const pool = getPool()

  const owned = await verifyOptionOwnership(pool, optionId, tenantId)
  if (!owned) return NextResponse.json({ error: 'Opção não encontrada' }, { status: 404 })

  try {
    await pool.query(`DELETE FROM "Option" WHERE id = $1`, [optionId])
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const pgErr = err as { code?: string }
    if (pgErr?.code === '23503') {
      // Foreign key constraint — option is linked to orders
      return NextResponse.json(
        { error: 'Opção vinculada a pedidos — desative-a em vez de remover' },
        { status: 409 }
      )
    }
    throw err
  }
}
