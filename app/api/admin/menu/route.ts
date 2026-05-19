import { auth } from '@/lib/auth'
import { requireStaff } from '@/lib/session'
import { getPool } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  const tenantId = requireStaff(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()

  const { rows: categories } = await pool.query(
    `SELECT id, name, "order", active FROM "Category"
     WHERE "tenantId" = $1
     ORDER BY "order" ASC, name ASC`,
    [tenantId]
  )

  const { rows: products } = await pool.query(
    `SELECT id, "categoryId", name, description, price, "imageUrl", available, "sortOrder", featured
     FROM "Product"
     WHERE "tenantId" = $1
     ORDER BY "sortOrder" ASC`,
    [tenantId]
  )

  const menu = categories.map((cat: any) => ({
    ...cat,
    products: products.filter((p: any) => p.categoryId === cat.id),
  }))

  return NextResponse.json({ categories: menu })
}
