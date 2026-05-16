import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

const MP_BASE = 'https://api.mercadopago.com'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params
  const pool = getPool()

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { token, method, gateway, payerEmail } = body

  if (!token || !method || !gateway) {
    return NextResponse.json({ error: 'Dados de pagamento incompletos' }, { status: 400 })
  }

  const orderRes = await pool.query(
    `SELECT o.id, o.total, o."tenantId", o."paymentStatus"
     FROM "Order" o WHERE o.id = $1`,
    [orderId]
  )
  if (!orderRes.rows.length) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }
  const order = orderRes.rows[0]

  if (order.paymentStatus !== 'pending') {
    return NextResponse.json({ error: 'Pedido já foi pago' }, { status: 400 })
  }

  if (gateway === 'mercadopago') {
    const paRes = await pool.query(
      `SELECT "accessToken" FROM "TenantPaymentAccount"
       WHERE "tenantId" = $1 AND gateway = 'mercadopago'`,
      [order.tenantId]
    )
    const accessToken = paRes.rows[0]?.accessToken || process.env.MP_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json({ error: 'Gateway não configurado' }, { status: 400 })
    }

    const mpRes = await fetch(`${MP_BASE}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': orderId,
      },
      body: JSON.stringify({
        transaction_amount: order.total,
        token,
        payment_method_id: method === 'credit_card' ? 'visa' : method,
        installments: 1,
        external_reference: orderId,
        payer: { email: payerEmail || 'cliente@foodbio.com.br' },
      }),
    })

    const mpBody = await mpRes.json()
    if (!mpRes.ok) {
      return NextResponse.json(
        { error: mpBody?.message ?? 'Erro ao processar pagamento' },
        { status: 400 }
      )
    }

    const txId = randomUUID()
    await pool.query(
      `INSERT INTO "PaymentTransaction"
       (id, "orderId", "tenantId", gateway, "gatewayTransactionId",
        "totalAmount", "marketplaceFee", "sellerAmount", "gatewayFee",
        "splitStatus", "createdAt")
       VALUES ($1,$2,$3,'mercadopago',$4,$5,0,$5,0,'pending',NOW())`,
      [txId, orderId, order.tenantId, String(mpBody.id), order.total]
    )

    const paymentStatus = mpBody.status === 'approved' ? 'approved' : 'pending'
    await pool.query(
      `UPDATE "Order"
       SET "paymentStatus" = $1, "externalReference" = $2, "updatedAt" = NOW()
       WHERE id = $3`,
      [paymentStatus, String(mpBody.id), orderId]
    )

    return NextResponse.json({ status: mpBody.status })
  }

  return NextResponse.json({ error: 'Gateway não suportado' }, { status: 400 })
}
