import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function getAdminTenant(session: any): string | null {
  const user = session?.user as any
  if (!user || user.role !== 'admin' || !user.tenantId) return null
  return user.tenantId
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const tenantId = getAdminTenant(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const pool = getPool()

  const fields: string[] = []
  const values: any[] = []
  let idx = 1

  const allowed = ['name', 'description', 'price', 'categoryId', 'imageUrl', 'available', 'sortOrder', 'featured']
  for (const key of allowed) {
    if (body[key] !== undefined) {
      const col = key === 'categoryId' ? '"categoryId"' : key === 'imageUrl' ? '"imageUrl"' : key === 'sortOrder' ? '"sortOrder"' : `"${key}"`
      fields.push(`${col} = $${idx}`)
      values.push(body[key])
      idx++
    }
  }

  if (fields.length === 0) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })

  values.push(id, tenantId)
  const { rows } = await pool.query(
    `UPDATE "Product" SET ${fields.join(', ')} WHERE id = $${idx} AND "tenantId" = $${idx + 1}
     RETURNING id, "categoryId", name, description, price, "imageUrl", available, "sortOrder", featured`,
    values
  )

  if (rows.length === 0) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const tenantId = getAdminTenant(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const pool = getPool()
  await pool.query(`DELETE FROM "Product" WHERE id = $1 AND "tenantId" = $2`, [id, tenantId])
  return NextResponse.json({ ok: true })
}
