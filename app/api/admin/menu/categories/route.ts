import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function getAdminTenant(session: any): string | null {
  const user = session?.user as any
  if (!user || user.role !== 'admin' || !user.tenantId) return null
  return user.tenantId
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const tenantId = getAdminTenant(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { name, order } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const pool = getPool()
  const id = crypto.randomUUID()
  const { rows } = await pool.query(
    `INSERT INTO "Category" (id, "tenantId", name, "order", active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, name, "order", active`,
    [id, tenantId, name.trim(), order ?? 0]
  )

  return NextResponse.json(rows[0], { status: 201 })
}
