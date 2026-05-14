import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function requireSuperAdmin(session: any) {
  return session && (session.user as any).role === 'superadmin'
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!requireSuperAdmin(session)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const pool = getPool()

  const fields: string[] = []
  const values: any[] = []
  let idx = 1

  const allowed = ['name', 'slug', 'phone', 'address', 'city', 'state', 'plan', 'planStatus', 'planPrice', 'planDueDate', 'active']
  for (const key of allowed) {
    if (body[key] !== undefined) {
      fields.push(`"${key}" = $${idx}`)
      values.push(body[key])
      idx++
    }
  }

  if (fields.length === 0) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })

  fields.push(`"updatedAt" = NOW()`)
  values.push(id)

  const { rows } = await pool.query(
    `UPDATE "Tenant" SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, slug, name, "planStatus", "planPrice", "planDueDate", active`,
    values
  )

  if (rows.length === 0) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!requireSuperAdmin(session)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const pool = getPool()
  await pool.query(`UPDATE "Tenant" SET active = false, "planStatus" = 'cancelled', "updatedAt" = NOW() WHERE id = $1`, [id])
  return NextResponse.json({ ok: true })
}
