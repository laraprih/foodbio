import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const pool = getPool()
  const { slug } = await params

  const { rows } = await pool.query(
    `SELECT t.id, t.name, t.slug, t."deliveryFee",
            tpa.gateway
     FROM "Tenant" t
     LEFT JOIN "TenantPaymentAccount" tpa ON tpa."tenantId" = t.id
     WHERE t.slug = $1 AND t.active = true
     LIMIT 1`,
    [slug]
  )

  if (!rows.length) {
    return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
  }

  const row = rows[0]
  return NextResponse.json({
    id: row.id,
    name: row.name,
    slug: row.slug,
    deliveryFee: row.deliveryFee,
    gateway: row.gateway ?? null,
  })
}
