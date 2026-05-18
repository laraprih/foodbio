import { getPool } from '@/lib/db'

export async function getTenantBySlugDirect(slug: string) {
  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, name, slug, phone, address, city, state,
            "logoUrl", "logoFormat", "coverUrl", "deliveryFee",
            "minOrderValue", "deliveryRadius", "openingHours", active
     FROM "Tenant"
     WHERE slug = $1 AND active = true`,
    [slug]
  )
  return rows[0] ?? null
}

export async function getTenantMenuDirect(tenantId: string) {
  const pool = getPool()
  const { rows: categories } = await pool.query(
    `SELECT id, name, "order", active FROM "Category"
     WHERE "tenantId" = $1 AND active = true
     ORDER BY "order" ASC`,
    [tenantId]
  )

  const { rows: products } = await pool.query(
    `SELECT id, "categoryId", name, description, price,
            "imageUrl", available, "sortOrder", featured
     FROM "Product"
     WHERE "tenantId" = $1 AND available = true
     ORDER BY "sortOrder" ASC`,
    [tenantId]
  )

  const menu = categories.map((cat: any) => ({
    ...cat,
    products: products.filter((p: any) => p.categoryId === cat.id),
  }))

  return { categories: menu }
}
