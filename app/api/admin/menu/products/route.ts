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

  const { name, description, price, categoryId, imageUrl, available, sortOrder, featured } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  if (!price || isNaN(Number(price)) || Number(price) <= 0) return NextResponse.json({ error: 'Preço inválido' }, { status: 400 })
  if (!categoryId) return NextResponse.json({ error: 'Categoria obrigatória' }, { status: 400 })

  const pool = getPool()

  const catCheck = await pool.query(
    `SELECT id FROM "Category" WHERE id = $1 AND "tenantId" = $2`,
    [categoryId, tenantId]
  )
  if (catCheck.rows.length === 0) return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })

  const id = crypto.randomUUID()
  const { rows } = await pool.query(
    `INSERT INTO "Product" (id, "tenantId", "categoryId", name, description, price, "imageUrl", available, "sortOrder", featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, "categoryId", name, description, price, "imageUrl", available, "sortOrder", featured`,
    [id, tenantId, categoryId, name.trim(), description ?? null, Number(price), imageUrl ?? null, available !== false, sortOrder ?? 0, featured === true]
  )

  return NextResponse.json(rows[0], { status: 201 })
}
