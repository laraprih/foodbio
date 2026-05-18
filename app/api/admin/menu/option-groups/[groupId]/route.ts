import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import type { Pool } from 'pg'

function getAdminTenant(session: unknown): string | null {
  const user = (session as { user?: { role?: string; tenantId?: string } } | null)?.user
  if (!user || user.role !== 'admin' || !user.tenantId) return null
  return user.tenantId
}

async function verifyGroupOwnership(
  pool: Pool,
  groupId: string,
  tenantId: string
): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT og.id
     FROM "OptionGroup" og
     JOIN "Product" p ON p.id = og."productId"
     WHERE og.id = $1 AND p."tenantId" = $2`,
    [groupId, tenantId]
  )
  return rows.length > 0
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth()
  const tenantId = getAdminTenant(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { groupId } = await params
  const pool = getPool()

  const owned = await verifyGroupOwnership(pool, groupId, tenantId)
  if (!owned) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })

  const body = await req.json()
  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (body.name !== undefined) { fields.push(`name = $${idx}`); values.push(body.name); idx++ }
  if (body.required !== undefined) { fields.push(`required = $${idx}`); values.push(body.required); idx++ }
  if (body.maxChoices !== undefined) { fields.push(`"maxChoices" = $${idx}`); values.push(body.maxChoices); idx++ }
  if (body.minChoices !== undefined) { fields.push(`"minChoices" = $${idx}`); values.push(body.minChoices); idx++ }

  if (fields.length === 0) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })

  values.push(groupId)
  const { rows } = await pool.query(
    `UPDATE "OptionGroup" SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, name, required, "maxChoices", "minChoices"`,
    values
  )

  return NextResponse.json(rows[0])
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth()
  const tenantId = getAdminTenant(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { groupId } = await params
  const pool = getPool()

  const owned = await verifyGroupOwnership(pool, groupId, tenantId)
  if (!owned) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })

  await pool.query(`DELETE FROM "Option" WHERE "groupId" = $1`, [groupId])
  await pool.query(`DELETE FROM "OptionGroup" WHERE id = $1`, [groupId])

  return NextResponse.json({ ok: true })
}
