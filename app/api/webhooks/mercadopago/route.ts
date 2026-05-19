import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { createHmac } from 'crypto'
import { serverEmit } from '@/lib/server-emit'
import { sendOrderConfirmation, normalizeWhatsAppPhone } from '@/lib/whatsapp'
import { decryptMPToken } from '@/lib/decrypt-mp-token'

export const dynamic = 'force-dynamic'

const MP_BASE = 'https://api.mercadopago.com'

function validateSignature(req: NextRequest): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true // skip if not configured

  const xSignature = req.headers.get('x-signature') ?? ''
  if (!xSignature) return true // absent = unauthenticated test ping — allow through

  const xRequestId = req.headers.get('x-request-id') ?? ''

  // x-signature format: "ts=<timestamp>,v1=<hmac_hex>"
  const ts = xSignature.match(/ts=([^,]+)/)?.[1] ?? ''
  const v1 = xSignature.match(/v1=([^,]+)/)?.[1] ?? ''

  if (!ts || !v1) return false // malformed header — reject

  // MP manifest: id:<data.id query param>;request-id:<x-request-id>;ts:<ts>;
  const dataId = req.nextUrl.searchParams.get('data.id') ?? ''
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  return expected === v1
}

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

  // Read raw body for signature validation
  const rawBody = await req.text()

  // Validate MP signature
  if (!validateSignature(req)) {
    console.warn('[webhook/mp] Invalid signature — request rejected')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: true })
  }

  // MP sends a test ping on webhook registration — always accept
  if (body?.action === 'test' || body?.type === 'test') {
    return NextResponse.json({ ok: true })
  }

  // We only handle payment notifications
  if (body?.type !== 'payment') {
    return NextResponse.json({ ok: true })
  }

  const paymentId = String(body?.data?.id ?? '')
  if (!paymentId) return NextResponse.json({ ok: true })

  // Resolve MP access token: tenant-specific token > platform env var
  let accessToken = process.env.MP_ACCESS_TOKEN

  const orderByRef = await pool.query(
    `SELECT o.id, o."tenantId" FROM "Order" o WHERE o."externalReference" = $1 LIMIT 1`,
    [paymentId]
  )
  if (orderByRef.rows.length) {
    const tenantId = orderByRef.rows[0].tenantId
    const paRes = await pool.query(
      `SELECT "accessToken" FROM "TenantPaymentAccount"
       WHERE "tenantId" = $1 AND gateway = 'mercadopago'`,
      [tenantId]
    )
    if (paRes.rows[0]?.accessToken) {
      accessToken = decryptMPToken(paRes.rows[0].accessToken)
    }
  }

  if (!accessToken) {
    console.warn('[webhook/mp] No access token configured')
    return NextResponse.json({ ok: true })
  }

  const payment = await fetchMPPayment(paymentId, accessToken)
  if (!payment) return NextResponse.json({ ok: true })

  const externalRef: string = payment.external_reference ?? ''
  const mpStatus: string    = payment.status

  if (!externalRef) return NextResponse.json({ ok: true })

  // ── Pagamento de mesa pelo garçom ─────────────────────────────────────────
  if (externalRef.startsWith('garcom-table-')) {
    const tableId = externalRef.replace('garcom-table-', '')

    if (mpStatus === 'approved') {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // Baixa todos os pedidos pendentes da mesa
        const { rows: updatedOrders } = await client.query(
          `UPDATE "Order"
           SET "paymentStatus" = 'approved',
               "paymentMethod" = 'pix',
               status          = 'delivered',
               "updatedAt"     = NOW()
           WHERE "tableId"      = $1
             AND "paymentStatus" = 'pending'
             AND status         != 'cancelled'
           RETURNING id, "tenantId", total`,
          [tableId]
        )

        if (updatedOrders.length > 0) {
          const tenantId    = updatedOrders[0].tenantId as string
          const totalPaid   = updatedOrders.reduce((s: number, o: any) => s + Number(o.total), 0)
          const tableRes    = await client.query(
            `UPDATE "Table" SET status = 'free' WHERE id = $1 RETURNING number`,
            [tableId]
          )
          const tableNumber = tableRes.rows[0]?.number

          await client.query('COMMIT')

          // Notifica todo o sistema
          await serverEmit({
            rooms: [
              `garcom:${tenantId}`,
              `admin:${tenantId}`,
              `pdv:${tenantId}`,
              `kitchen:${tenantId}`,
            ],
            event: 'table_paid',
            data: {
              tableId,
              tableNumber,
              paymentMethod: 'pix',
              totalPaid,
              ordersUpdated: updatedOrders.length,
              source: 'mercadopago',
            },
          })
        } else {
          await client.query('ROLLBACK')
        }
      } catch (err) {
        await client.query('ROLLBACK')
        console.error('[webhook/mp] garcom table payment error:', err)
      } finally {
        client.release()
      }
    }

    console.info(`[webhook/mp] garcom table=${tableId} payment=${paymentId} status=${mpStatus}`)
    return NextResponse.json({ ok: true })
  }

  // ── Pagamento normal de pedido online ─────────────────────────────────────
  const orderId = externalRef

  if (mpStatus === 'approved') {
    const { rowCount } = await pool.query(
      `UPDATE "Order" SET "paymentStatus" = 'approved', status = 'confirmed', "updatedAt" = NOW()
       WHERE id = $1 AND "paymentStatus" != 'approved'
       RETURNING "tenantId"`,
      [orderId]
    )

    if (rowCount && rowCount > 0) {
      // Busca tenantId para emitir nas salas corretas
      const tenantRes = await pool.query(
        `SELECT "tenantId" FROM "Order" WHERE id = $1`,
        [orderId]
      )
      const tenantId: string = tenantRes.rows[0]?.tenantId ?? ''

      await pool.query(
        `UPDATE "PaymentTransaction" SET "splitStatus" = 'done', "processedAt" = NOW()
         WHERE "orderId" = $1`,
        [orderId]
      )

      // Notifica: cliente acompanhando o pedido + cozinha + admin
      await serverEmit({
        rooms: [`order:${orderId}`, `kitchen:${tenantId}`, `admin:${tenantId}`],
        event: 'order:confirmed',
        data: { orderId, status: 'confirmed' },
      })

      // Envia WhatsApp se o número do cliente estiver verificado
      await notifyCustomerWhatsApp(pool, orderId, tenantId).catch((e) =>
        console.error('[webhook/mp] whatsapp notification error:', e)
      )
    }
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

    await serverEmit({
      rooms: [`order:${orderId}`],
      event: 'order:payment-failed',
      data: { orderId, message: 'Pagamento não aprovado. Tente novamente.' },
    })
  } else if (mpStatus === 'refunded') {
    await pool.query(
      `UPDATE "Order" SET "paymentStatus" = 'refunded', "updatedAt" = NOW() WHERE id = $1`,
      [orderId]
    )
    await pool.query(
      `UPDATE "PaymentTransaction" SET "splitStatus" = 'refunded' WHERE "orderId" = $1`,
      [orderId]
    )

    await serverEmit({
      rooms: [`order:${orderId}`],
      event: 'order:update',
      data: { orderId, status: 'refunded' },
    })
  }

  console.info(`[webhook/mp] payment=${paymentId} status=${mpStatus} order=${orderId}`)
  return NextResponse.json({ ok: true })
}

async function notifyCustomerWhatsApp(pool: any, orderId: string, tenantId: string) {
  // Busca dados do pedido e tenant em paralelo
  const [orderRes, tenantRes] = await Promise.all([
    pool.query(
      `SELECT "customerPhone", "customerName" FROM "Order" WHERE id = $1`,
      [orderId]
    ),
    pool.query(
      `SELECT name, slug FROM "Tenant" WHERE id = $1`,
      [tenantId]
    ),
  ])

  const order  = orderRes.rows[0]
  const tenant = tenantRes.rows[0]
  if (!order?.customerPhone || !tenant) return

  const phone = normalizeWhatsAppPhone(order.customerPhone)

  // Só envia se o número foi verificado pelo cliente
  const { rows: vRows } = await pool.query(
    `SELECT verified FROM "WhatsAppVerification" WHERE phone = $1`,
    [phone]
  )
  if (!vRows[0]?.verified) return

  const orderCode = orderId.slice(-8).toUpperCase()
  await sendOrderConfirmation({
    phone,
    customerName: order.customerName ?? '',
    orderId,
    orderCode,
    slug: tenant.slug,
    tenantName: tenant.name,
  })

  console.info(`[webhook/mp] whatsapp sent to ${phone} for order ${orderId}`)
}
