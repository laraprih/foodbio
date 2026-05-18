import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { id } = params
  const body = await req.json()

  const allowed = ['status', 'capacity', 'label', 'active']
  const sets: string[] = []
  const values: unknown[] = []

  for (const key of allowed) {
    if (key in body) {
      values.push(body[key])
      sets.push(`"${key}" = $${values.length}`)
    }
  }

  if (!sets.length) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })

  values.push(id, session.tenantId)
  const { rows } = await pool.query(
    `UPDATE "Table" SET ${sets.join(', ')}
     WHERE id = $${values.length - 1} AND "tenantId" = $${values.length}
     RETURNING *`,
    values
  )

  if (!rows.length) return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 })
  return NextResponse.json({ table: rows[0] })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { rows } = await pool.query(
    `UPDATE "Table" SET active = false
     WHERE id = $1 AND "tenantId" = $2
     RETURNING id`,
    [params.id, session.tenantId]
  )

  if (!rows.length) return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
