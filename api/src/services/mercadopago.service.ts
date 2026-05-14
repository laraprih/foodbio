import { createHmac } from 'crypto'
import logger from '@/lib/logger'

const MP_BASE = 'https://api.mercadopago.com'
const MARKETPLACE_TOKEN = process.env.MP_MARKETPLACE_TOKEN ?? ''

interface MPOrderParams {
  total: number
  marketplaceFee: number
  paymentMethodId: string
  token?: string
  externalReference: string
  payerEmail: string
}

async function mpFetch(path: string, options: RequestInit) {
  const res = await fetch(`${MP_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MARKETPLACE_TOKEN}`,
      ...(options.headers ?? {}),
    },
    signal: AbortSignal.timeout(25_000),
  })

  const body = await res.json()

  if (!res.ok) {
    logger.error({ path, status: res.status, body }, 'Mercado Pago API error')
    throw new Error(`Erro no gateway Mercado Pago: ${body?.message ?? res.statusText}`)
  }

  return body
}

export async function createOrder(params: MPOrderParams) {
  const payload: Record<string, unknown> = {
    type: 'online',
    processing_mode: 'aggregator',
    total_amount: params.total.toFixed(2),
    marketplace_fee: params.marketplaceFee.toFixed(2),
    external_reference: params.externalReference,
    payer: { email: params.payerEmail },
    payment_method: {
      payment_method_id: params.paymentMethodId,
      ...(params.token ? { token: params.token } : {}),
    },
  }

  logger.info({ externalReference: params.externalReference }, 'Creating MP order')
  return mpFetch('/v1/orders', { method: 'POST', body: JSON.stringify(payload) })
}

export async function exchangeOAuthCode(code: string): Promise<{ accessToken: string; userId: string }> {
  const body = await mpFetch('/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      client_id: process.env.MP_CLIENT_ID,
      client_secret: process.env.MP_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.MP_REDIRECT_URI,
    }),
  })

  return { accessToken: body.access_token, userId: String(body.user_id) }
}

export async function generatePixQR(orderId: string, amount: number) {
  const body = await mpFetch('/v1/payments', {
    method: 'POST',
    body: JSON.stringify({
      transaction_amount: amount,
      payment_method_id: 'pix',
      external_reference: orderId,
      payer: { email: 'cliente@foodin.com.br' },
    }),
  })

  return {
    qrCode: body.point_of_interaction?.transaction_data?.qr_code ?? '',
    qrBase64: body.point_of_interaction?.transaction_data?.qr_code_base64 ?? '',
    expiresAt: body.date_of_expiration ?? '',
  }
}

export function validateWebhookSignature(signature: string, requestId: string, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET ?? ''
  const manifest = `id:${requestId};request-id:${requestId};ts:${Date.now()};`
  const expected = createHmac('sha256', secret).update(manifest + rawBody).digest('hex')
  return signature === `ts=${Date.now()},v1=${expected}` || signature.includes(expected)
}
