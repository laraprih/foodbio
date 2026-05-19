import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/session'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const tenantId = requireAdmin(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const pool = getPool()

  // Load order
  const { rows } = await pool.query(
    `SELECT o."externalReference", o."paymentStatus", o."paymentMethod"
     FROM "Order" o
     WHERE o.id = $1 AND o."tenantId" = $2`,
    [id, tenantId]
  )

  if (!rows.length) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  const order = rows[0]

  if (order.paymentStatus !== 'approved') {
    return NextResponse.json({ error: 'Só é possível estornar pagamentos aprovados' }, { status: 400 })
  }

  if (!order.externalReference) {
    return NextResponse.json({ error: 'ID de pagamento não encontrado para este pedido' }, { status: 400 })
  }

  // Get tenant MP access token
  const paRes = await pool.query(
    `SELECT "accessToken" FROM "TenantPaymentAccount"
     WHERE "tenantId" = $1 AND gateway = 'mercadopago'`,
    [tenantId]
  )
  const accessToken = paRes.rows[0]?.accessToken || process.env.MP_ACCESS_TOKEN

  if (!accessToken) {
    return NextResponse.json({ error: 'Mercado Pago não configurado' }, { status: 400 })
  }

  // Call MP refund API
  const mpRes = await fetch(
    `https://api.mercadopago.com/v1/payments/${order.externalReference}/refunds`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: '{}',
    }
  )

  if (!mpRes.ok) {
    const body = await mpRes.json()
    console.error('[refund] MP error:', body)
    return NextResponse.json(
      { error: body?.message ?? 'Erro ao processar estorno no Mercado Pago' },
      { status: 400 }
    )
  }

  // Update order payment status
  await pool.query(
    `UPDATE "Order" SET "paymentStatus" = 'refunded', "updatedAt" = NOW() WHERE id = $1`,
    [id]
  )
  await pool.query(
    `UPDATE "PaymentTransaction" SET "splitStatus" = 'refunded', "updatedAt" = NOW()
     WHERE "orderId" = $1`,
    [id]
  )

  return NextResponse.json({ ok: true })
}
