import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

function getAdminTenantId(session: any): string | null {
  const user = session?.user as any
  if (!user || user.role !== 'admin' || !user.tenantId) return null
  return user.tenantId
}

export async function GET() {
  const session = await auth()
  const tenantId = getAdminTenantId(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT t.id, t.name, t.slug, t.phone, t.address, t.city, t.state,
            t."logoUrl", t."logoFormat", t."coverUrl",
            t."deliveryFee", t."minOrderValue", t."deliveryRadius",
            tpa.gateway, tpa."accessToken" AS "mpAccessToken"
     FROM "Tenant" t
     LEFT JOIN "TenantPaymentAccount" tpa ON tpa."tenantId" = t.id
     WHERE t.id = $1`,
    [tenantId]
  )

  if (!rows.length) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const row = rows[0]
  return NextResponse.json({
    id: row.id,
    name: row.name,
    slug: row.slug,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    logoUrl: row.logoUrl,
    logoFormat: row.logoFormat ?? 'square',
    coverUrl: row.coverUrl,
    deliveryFee: row.deliveryFee,
    minOrderValue: row.minOrderValue,
    deliveryRadius: row.deliveryRadius,
    gateway: row.gateway ?? null,
    mpAccessToken: row.mpAccessToken ?? null,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const tenantId = getAdminTenantId(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const body = await req.json()

  const {
    name, phone, address, city, state,
    logoUrl, logoFormat, coverUrl,
    deliveryFee, minOrderValue, deliveryRadius,
    mpAccessToken,
  } = body

  // Update Tenant
  await pool.query(
    `UPDATE "Tenant" SET
       name = COALESCE($1, name),
       phone = $2,
       address = $3,
       city = $4,
       state = $5,
       "logoUrl" = $6,
       "logoFormat" = COALESCE($7, "logoFormat"),
       "coverUrl" = $8,
       "deliveryFee" = COALESCE($9, "deliveryFee"),
       "minOrderValue" = COALESCE($10, "minOrderValue"),
       "deliveryRadius" = COALESCE($11, "deliveryRadius"),
       "updatedAt" = NOW()
     WHERE id = $12`,
    [
      name || null, phone || null, address || null, city || null, state || null,
      logoUrl || null, logoFormat || null, coverUrl || null,
      deliveryFee != null ? Number(deliveryFee) : null,
      minOrderValue != null ? Number(minOrderValue) : null,
      deliveryRadius != null ? Number(deliveryRadius) : null,
      tenantId,
    ]
  )

  // Upsert MP access token
  if (mpAccessToken !== undefined) {
    if (mpAccessToken) {
      const existing = await pool.query(
        `SELECT id FROM "TenantPaymentAccount" WHERE "tenantId" = $1`,
        [tenantId]
      )
      if (existing.rows.length) {
        await pool.query(
          `UPDATE "TenantPaymentAccount"
           SET gateway = 'mercadopago', "accessToken" = $1,
               "onboardingStatus" = 'active', "updatedAt" = NOW()
           WHERE "tenantId" = $2`,
          [mpAccessToken, tenantId]
        )
      } else {
        await pool.query(
          `INSERT INTO "TenantPaymentAccount"
           (id, "tenantId", gateway, "externalAccountId", "accessToken", "onboardingStatus", "updatedAt")
           VALUES ($1, $2, 'mercadopago', $2, $3, 'active', NOW())`,
          [randomUUID(), tenantId, mpAccessToken]
        )
      }
    } else {
      // Blank token = remove
      await pool.query(
        `DELETE FROM "TenantPaymentAccount" WHERE "tenantId" = $1`,
        [tenantId]
      )
    }
  }

  return NextResponse.json({ ok: true })
}
