import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

const MP_BASE = 'https://api.mercadopago.com'

async function fetchMPPayment(paymentId: string, accessToken: string) {
  const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) return null
  return res.json()
}

export async function POST(req: NextRequest) {
  const pool = getPool()

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  // MP sends a test ping on webhook registration
  if (body?.action === 'test' || body?.type === 'test') {
    return NextResponse.json({ ok: true })
  }

  // We only handle payment notifications
  if (body?.type !== 'payment') {
    return NextResponse.json({ ok: true })
  }

  const paymentId = String(body?.data?.id ?? '')
  if (!paymentId) return NextResponse.json({ ok: true })

  // Get MP access token — try tenant-specific first via externalReference lookup
  // Fall back to platform-level env var
  let accessToken = process.env.MP_ACCESS_TOKEN

  // If we find the order first we can get the tenant's token
  const orderByRef = await pool.query(
    `SELECT o.id, o."tenantId" FROM "Order" o WHERE o."externalReference" = $1 LIMIT 1`,
    [paymentId]
  )
  if (orderByRef.rows.length) {
    const tenantId = orderByRef.rows[0].tenantId
    const paRes = await pool.query(
      `SELECT "accessToken" FROM "TenantPaymentAccount" WHERE "tenantId" = $1 AND gateway = 'mercadopago'`,
      [tenantId]
    )
    if (paRes.rows[0]?.accessToken) accessToken = paRes.rows[0].accessToken
  }

  if (!accessToken) {
    console.warn('[webhook/mp] No access token configured')
    return NextResponse.json({ ok: true })
  }

  const payment = await fetchMPPayment(paymentId, accessToken)
  if (!payment) return NextResponse.json({ ok: true })

  const orderId = payment.external_reference
  const mpStatus: string = payment.status // approved | pending | rejected | cancelled | refunded

  if (!orderId) return NextResponse.json({ ok: true })

  // Upsert payment status
  if (mpStatus === 'approved') {
    await pool.query(
      `UPDATE "Order" SET "paymentStatus" = 'approved', status = 'confirmed', "updatedAt" = NOW()
       WHERE id = $1 AND "paymentStatus" != 'approved'`,
      [orderId]
    )
    await pool.query(
      `UPDATE "PaymentTransaction" SET "splitStatus" = 'done', "processedAt" = NOW()
       WHERE "orderId" = $1`,
      [orderId]
    )
  } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
    await pool.query(
      `UPDATE "Order" SET "paymentStatus" = 'failed', "updatedAt" = NOW()
       WHERE id = $1 AND "paymentStatus" = 'pending'`,
      [orderId]
    )
    await pool.query(
      `UPDATE "PaymentTransaction" SET "splitStatus" = 'failed' WHERE "orderId" = $1`,
      [orderId]
    )
  } else if (mpStatus === 'refunded') {
    await pool.query(
      `UPDATE "Order" SET "paymentStatus" = 'refunded', "updatedAt" = NOW() WHERE id = $1`,
      [orderId]
    )
    await pool.query(
      `UPDATE "PaymentTransaction" SET "splitStatus" = 'refunded' WHERE "orderId" = $1`,
      [orderId]
    )
  }

  console.info(`[webhook/mp] payment=${paymentId} status=${mpStatus} order=${orderId}`)
  return NextResponse.json({ ok: true })
}
