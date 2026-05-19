import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { randomUUID } from 'crypto'
import { serverEmit } from '@/lib/server-emit'
import { auth } from '@/lib/auth'
import { decryptMPToken } from '@/lib/decrypt-mp-token'

export const dynamic = 'force-dynamic'

const MP_BASE = 'https://api.mercadopago.com'

async function generatePixQR(accessToken: string, orderId: string, amount: number, payerEmail: string) {
  const res = await fetch(`${MP_BASE}/v1/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Idempotency-Key': orderId,
    },
    body: JSON.stringify({
      transaction_amount: amount,
      payment_method_id: 'pix',
      external_reference: orderId,
      payer: { email: payerEmail || 'cliente@foodbio.com.br' },
    }),
  })
  const body = await res.json()
  if (!res.ok) {
    console.error('[PIX] MP error:', body)
    throw new Error(body?.message ?? 'Erro ao gerar PIX no Mercado Pago')
  }
  return {
    mpPaymentId: String(body.id),
    qrCode: body.point_of_interaction?.transaction_data?.qr_code ?? '',
    qrBase64: body.point_of_interaction?.transaction_data?.qr_code_base64 ?? '',
    expiresAt: body.date_of_expiration ?? null,
  }
}

export async function POST(req: NextRequest) {
  const pool = getPool()
  const session = await auth()
  const sessionUser = session?.user as any

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { restaurantId, items, deliveryType, address, customerName, customerPhone, paymentMethod, payerEmail } = body

  if (!restaurantId || !items?.length || !paymentMethod) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // Validate tenant
  const tenantRes = await pool.query(
    'SELECT id, "deliveryFee", "minOrderValue" FROM "Tenant" WHERE id = $1 AND active = true',
    [restaurantId]
  )
  if (!tenantRes.rows.length) {
    return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
  }
  const tenant = tenantRes.rows[0]

  // Validate and price items
  let subtotal = 0
  const itemDetails: { productId: string; quantity: number; unitPrice: number; totalPrice: number }[] = []

  for (const item of items) {
    const productRes = await pool.query(
      'SELECT id, price FROM "Product" WHERE id = $1 AND "tenantId" = $2 AND available = true',
      [item.productId, restaurantId]
    )
    if (!productRes.rows.length) {
      return NextResponse.json({ error: `Produto indisponível: ${item.productId}` }, { status: 400 })
    }
    const product = productRes.rows[0]
    const itemTotal = product.price * item.quantity
    subtotal += itemTotal
    itemDetails.push({ productId: product.id, quantity: item.quantity, unitPrice: product.price, totalPrice: itemTotal })
  }

  const fee = deliveryType === 'delivery' ? (tenant.deliveryFee ?? 0) : 0
  const total = subtotal + fee
  const orderId = randomUUID()

  // Resolve customerId if user is logged in as customer
  let customerId: string | null = null
  if (sessionUser?.role === 'customer' && sessionUser?.id) {
    const custRes = await pool.query(
      `SELECT id FROM "Customer" WHERE "userId" = $1`,
      [sessionUser.id]
    )
    customerId = custRes.rows[0]?.id ?? null
  }

  // Create order + items in a transaction
  const client = await pool.connect()
  // Pedidos em dinheiro são pagos na hora — entram direto como confirmados
  const isCash = paymentMethod === 'cash'
  const initialStatus = isCash ? 'confirmed' : 'pending'
  const initialPaymentStatus = isCash ? 'approved' : 'pending'

  try {
    await client.query('BEGIN')

    await client.query(
      `INSERT INTO "Order" (id, "tenantId", type, status, total, subtotal, "deliveryFee",
       "paymentStatus", "paymentMethod", "deliveryAddress", "customerName", "customerPhone",
       "customerId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$11,$4,$5,$6,$12,$7,$8,$9,$10,$13,NOW(),NOW())`,
      [
        orderId, restaurantId,
        deliveryType === 'delivery' ? 'delivery' : 'pickup',
        total, subtotal, fee, paymentMethod,
        address ? JSON.stringify(address) : null,
        customerName, customerPhone,
        initialStatus, initialPaymentStatus,
        customerId,
      ]
    )

    for (const item of itemDetails) {
      await client.query(
        `INSERT INTO "OrderItem" (id, "orderId", "productId", quantity, "unitPrice", "totalPrice")
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [randomUUID(), orderId, item.productId, item.quantity, item.unitPrice, item.totalPrice]
      )
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[order] DB error:', err)
    return NextResponse.json({ error: 'Erro ao salvar pedido' }, { status: 500 })
  } finally {
    client.release()
  }

  // Notifica cozinha e admin em tempo real
  if (paymentMethod !== 'pix') {
    await serverEmit({
      rooms: [`kitchen:${restaurantId}`, `admin:${restaurantId}`],
      event: 'new_order',
      data: { orderId, total, type: deliveryType, itemCount: itemDetails.length, status: initialStatus },
    })
  }

  // Generate PIX if needed
  if (paymentMethod === 'pix') {
    // Look up tenant MP access token, fall back to env var
    const paRes = await pool.query(
      `SELECT "accessToken" FROM "TenantPaymentAccount"
       WHERE "tenantId" = $1 AND gateway = 'mercadopago'`,
      [restaurantId]
    )
    const rawToken = paRes.rows[0]?.accessToken
    const accessToken = rawToken ? decryptMPToken(rawToken) : process.env.MP_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json({ error: 'PIX não configurado nesta loja. Configure o Mercado Pago nas configurações.' }, { status: 400 })
    }

    try {
      const pix = await generatePixQR(accessToken, orderId, total, payerEmail || 'cliente@foodbio.com.br')

      const txId = randomUUID()
      const pixPayload = { qrCode: pix.qrCode, qrBase64: pix.qrBase64, expiresAt: pix.expiresAt }

      await pool.query(
        `INSERT INTO "PaymentTransaction"
         (id, "orderId", "tenantId", gateway, "gatewayTransactionId",
          "totalAmount", "marketplaceFee", "sellerAmount", "gatewayFee",
          "splitStatus", "payloadResponse", "createdAt")
         VALUES ($1,$2,$3,'mercadopago',$4,$5,0,$5,0,'pending',$6,NOW())`,
        [txId, orderId, restaurantId, pix.mpPaymentId, total, JSON.stringify(pixPayload)]
      )

      await pool.query(
        `UPDATE "Order" SET "externalReference" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [pix.mpPaymentId, orderId]
      )

      return NextResponse.json({
        orderId,
        pixQrCode: pix.qrCode,
        pixQrBase64: pix.qrBase64,
        pixExpiresAt: pix.expiresAt,
      })
    } catch (err) {
      console.error('[PIX] generation failed:', err)
      // Return order without PIX data — let order page show error
      return NextResponse.json({ orderId, pixError: 'Falha ao gerar QR Code PIX. Tente novamente.' })
    }
  }

  return NextResponse.json({ orderId })
}
