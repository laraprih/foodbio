import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getWaiterSession } from '@/lib/waiter-auth'
import { decryptMPToken, mpWebhookUrl } from '@/lib/decrypt-mp-token'

export const dynamic = 'force-dynamic'

const MP_BASE = 'https://api.mercadopago.com'

// POST /api/garcom/pix — cria cobrança PIX no MercadoPago para a mesa
export async function POST(req: NextRequest) {
  const session = await getWaiterSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { tableId } = body
  if (!tableId) return NextResponse.json({ error: 'tableId obrigatório' }, { status: 400 })

  const pool = getPool()

  // Busca mesa + dados do tenant
  const { rows: tableRows } = await pool.query(
    `SELECT t.number, ten.name AS "tenantName", ten.phone AS "tenantPhone", ten.city
     FROM "Table" t
     JOIN "Tenant" ten ON ten.id = t."tenantId"
     WHERE t.id = $1 AND t."tenantId" = $2 AND t.active = true`,
    [tableId, session.tenantId]
  )
  if (!tableRows.length) return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 })
  const { number: tableNumber, tenantName } = tableRows[0]

  // Soma todos os pedidos pendentes da mesa
  const { rows: orderRows } = await pool.query(
    `SELECT COALESCE(SUM(total), 0) AS total
     FROM "Order"
     WHERE "tableId"       = $1
       AND "tenantId"      = $2
       AND "paymentStatus" = 'pending'
       AND status          != 'cancelled'`,
    [tableId, session.tenantId]
  )
  const total = Number(orderRows[0]?.total ?? 0)
  if (total <= 0) {
    return NextResponse.json({ error: 'Sem pedidos pendentes para cobrar' }, { status: 400 })
  }

  // Busca access token do restaurante e DECRIPTA (AES-256-GCM, espelho do Fastify)
  const { rows: paRows } = await pool.query(
    `SELECT "accessToken" FROM "TenantPaymentAccount"
     WHERE "tenantId" = $1 AND gateway = 'mercadopago'`,
    [session.tenantId]
  )

  let accessToken: string
  if (paRows[0]?.accessToken) {
    accessToken = decryptMPToken(paRows[0].accessToken)
  } else if (process.env.MP_ACCESS_TOKEN) {
    accessToken = process.env.MP_ACCESS_TOKEN
  } else {
    return NextResponse.json(
      { error: 'MercadoPago não configurado para este restaurante' },
      { status: 422 }
    )
  }

  const externalReference = `garcom-table-${tableId}`
  const notificationUrl   = `${mpWebhookUrl()}/api/webhooks/mercadopago`

  // E-mail do pagador (MP exige campo válido, não aparece para o cliente final)
  const payerEmail = `garcom@foodbio.app`

  const mpRes = await fetch(`${MP_BASE}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization:       `Bearer ${accessToken}`,
      'Content-Type':      'application/json',
      'X-Idempotency-Key': `${externalReference}-${Date.now()}`,
    },
    body: JSON.stringify({
      transaction_amount: parseFloat(total.toFixed(2)),
      payment_method_id:  'pix',
      payer:              { email: payerEmail },
      description:        `Mesa ${tableNumber} — ${tenantName}`,
      external_reference: externalReference,
      notification_url:   notificationUrl,
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!mpRes.ok) {
    const err = await mpRes.json().catch(() => ({}))
    console.error('[garcom/pix] MP error:', JSON.stringify(err))
    return NextResponse.json(
      { error: 'Erro ao gerar cobrança PIX no MercadoPago', detail: err },
      { status: 502 }
    )
  }

  const mp     = await mpRes.json()
  const txData = mp.point_of_interaction?.transaction_data

  if (!txData?.qr_code) {
    return NextResponse.json({ error: 'MercadoPago não retornou QR code PIX' }, { status: 502 })
  }

  return NextResponse.json({
    paymentId:        String(mp.id),
    total,
    qrCode:           txData.qr_code,         // copia-e-cola
    qrCodeBase64:     txData.qr_code_base64,  // PNG base64
    tableNumber,
    externalReference,
  })
}
