import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/session'
import { getPool } from '@/lib/db'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = session?.user as any
  if (!user || user.role !== 'admin' || !user.tenantId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const email: string = body.email?.trim()

  if (!email) {
    return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })
  }

  const pool = getPool()
  const tenantId: string = user.tenantId

  const existing = await pool.query(
    `SELECT id FROM "TenantPaymentAccount" WHERE "tenantId" = $1`,
    [tenantId]
  )

  if (existing.rows.length) {
    await pool.query(
      `UPDATE "TenantPaymentAccount"
       SET gateway = 'pagbank', "externalAccountId" = $1,
           "accessToken" = 'PENDING', "onboardingStatus" = 'pending', "updatedAt" = NOW()
       WHERE "tenantId" = $2`,
      [email, tenantId]
    )
  } else {
    await pool.query(
      `INSERT INTO "TenantPaymentAccount"
       (id, "tenantId", gateway, "externalAccountId", "accessToken", "onboardingStatus", "updatedAt")
       VALUES ($1, $2, 'pagbank', $3, 'PENDING', 'pending', NOW())`,
      [randomUUID(), tenantId, email]
    )
  }

  return NextResponse.json({ ok: true })
}
