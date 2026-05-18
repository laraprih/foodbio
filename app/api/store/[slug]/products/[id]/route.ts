import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params
  const pool = getPool()

  const { rows: productRows } = await pool.query(
    `SELECT p.id, p.name, p.description, p.price, p."imageUrl", p.available
     FROM "Product" p
     JOIN "Tenant" t ON t.id = p."tenantId"
     WHERE p.id = $1 AND t.slug = $2`,
    [id, slug]
  )

  if (productRows.length === 0) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  const product = productRows[0]

  const { rows: groups } = await pool.query(
    `SELECT id, name, required, "maxChoices", "minChoices"
     FROM "OptionGroup"
     WHERE "productId" = $1
     ORDER BY name`,
    [id]
  )

  if (groups.length === 0) {
    return NextResponse.json({ ...product, optionGroups: [] })
  }

  const groupIds = groups.map((g) => g.id)
  const { rows: options } = await pool.query(
    `SELECT id, "groupId", name, "priceModifier", available
     FROM "Option"
     WHERE "groupId" = ANY($1) AND available = true
     ORDER BY name`,
    [groupIds]
  )

  const optionGroups = groups.map((g) => ({
    id: g.id,
    name: g.name,
    required: g.required,
    maxSelections: g.maxChoices,
    minSelections: g.minChoices,
    options: options
      .filter((o) => o.groupId === g.id)
      .map((o) => ({
        id: o.id,
        name: o.name,
        price: o.priceModifier,
      })),
  }))

  return NextResponse.json({ ...product, optionGroups })
}
