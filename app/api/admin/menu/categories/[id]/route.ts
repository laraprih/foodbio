import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/session'
import { getPool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const tenantId = requireAdmin(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const pool = getPool()

  const fields: string[] = []
  const values: any[] = []
  let idx = 1

  const allowed = ['name', 'order', 'active']
  for (const key of allowed) {
    if (body[key] !== undefined) {
      fields.push(`"${key}" = $${idx}`)
      values.push(body[key])
      idx++
    }
  }

  if (fields.length === 0) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })

  values.push(id, tenantId)
  const { rows } = await pool.query(
    `UPDATE "Category" SET ${fields.join(', ')} WHERE id = $${idx} AND "tenantId" = $${idx + 1} RETURNING id, name, "order", active`,
    values
  )

  if (rows.length === 0) return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const tenantId = requireAdmin(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const pool = getPool()

  const { rows: products } = await pool.query(
    `SELECT id FROM "Product" WHERE "categoryId" = $1 AND "tenantId" = $2 LIMIT 1`,
    [id, tenantId]
  )
  if (products.length > 0) {
    return NextResponse.json({ error: 'Mova ou remova os produtos desta categoria primeiro' }, { status: 409 })
  }

  await pool.query(`DELETE FROM "Category" WHERE id = $1 AND "tenantId" = $2`, [id, tenantId])
  return NextResponse.json({ ok: true })
}
