import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getWaiterSession } from '@/lib/waiter-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getWaiterSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { tenantId } = session

  const [{ rows: categories }, { rows: products }, { rows: optionGroups }, { rows: options }] =
    await Promise.all([
      pool.query(
        `SELECT id, name, "order" FROM "Category"
         WHERE "tenantId" = $1 AND active = true
         ORDER BY "order" ASC, name ASC`,
        [tenantId]
      ),
      pool.query(
        `SELECT id, "categoryId", name, description, price, "imageUrl", available, "sortOrder"
         FROM "Product"
         WHERE "tenantId" = $1 AND available = true
         ORDER BY "sortOrder" ASC, name ASC`,
        [tenantId]
      ),
      pool.query(
        `SELECT og.id, og."productId", og.name, og.required, og."maxChoices", og."minChoices"
         FROM "OptionGroup" og
         JOIN "Product" p ON p.id = og."productId"
         WHERE p."tenantId" = $1`,
        [tenantId]
      ),
      pool.query(
        `SELECT o.id, o."groupId", o.name, o."priceModifier", o.available
         FROM "Option" o
         JOIN "OptionGroup" og ON og.id = o."groupId"
         JOIN "Product" p ON p.id = og."productId"
         WHERE p."tenantId" = $1 AND o.available = true`,
        [tenantId]
      ),
    ])

  const groupsWithOptions = optionGroups.map((g: any) => ({
    ...g,
    options: options.filter((o: any) => o.groupId === g.id),
  }))

  const menu = categories.map((cat: any) => ({
    ...cat,
    products: products
      .filter((p: any) => p.categoryId === cat.id)
      .map((p: any) => ({
        ...p,
        optionGroups: groupsWithOptions.filter((g: any) => g.productId === p.id),
      })),
  }))

  return NextResponse.json({ categories: menu })
}
