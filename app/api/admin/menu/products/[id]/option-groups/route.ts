import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function getAdminTenant(session: unknown): string | null {
  const user = (session as { user?: { role?: string; tenantId?: string } } | null)?.user
  if (!user || user.role !== 'admin' || !user.tenantId) return null
  return user.tenantId
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const tenantId = getAdminTenant(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: productId } = await params
  const pool = getPool()

  // Verify product belongs to tenant
  const productCheck = await pool.query(
    `SELECT id FROM "Product" WHERE id = $1 AND "tenantId" = $2`,
    [productId, tenantId]
  )
  if (productCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  const { rows: groups } = await pool.query(
    `SELECT id, name, required, "maxChoices", "minChoices"
     FROM "OptionGroup"
     WHERE "productId" = $1
     ORDER BY name`,
    [productId]
  )

  if (groups.length === 0) {
    return NextResponse.json([])
  }

  const groupIds = groups.map((g) => g.id)
  const { rows: options } = await pool.query(
    `SELECT id, "groupId", name, "priceModifier", available
     FROM "Option"
     WHERE "groupId" = ANY($1)
     ORDER BY name`,
    [groupIds]
  )

  const result = groups.map((g) => ({
    ...g,
    options: options.filter((o) => o.groupId === g.id),
  }))

  return NextResponse.json(result)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const tenantId = getAdminTenant(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: productId } = await params
  const pool = getPool()

  // Verify product belongs to tenant
  const productCheck = await pool.query(
    `SELECT id FROM "Product" WHERE id = $1 AND "tenantId" = $2`,
    [productId, tenantId]
  )
  if (productCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
  }

  const body = await req.json()
  const { name, required = false, maxChoices = 1, minChoices = 0 } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const { rows } = await pool.query(
    `INSERT INTO "OptionGroup" (id, "productId", name, required, "maxChoices", "minChoices")
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, required, "maxChoices", "minChoices"`,
    [id, productId, name.trim(), required, maxChoices, minChoices]
  )

  return NextResponse.json({ ...rows[0], options: [] }, { status: 201 })
}
