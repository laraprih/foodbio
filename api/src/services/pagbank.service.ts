import { createHmac } from 'crypto'
import logger from '@/lib/logger'

const PB_BASE = process.env.PB_BASE_URL ?? 'https://api.pagseguro.com'
const PB_TOKEN = process.env.PB_API_TOKEN ?? ''

interface PBOrderParams {
  total: number
  receiverAccountId: string
  receiverPercent: number
  token?: string
  paymentType: string
  externalReference: string
}

async function pbFetch(path: string, options: RequestInit) {
  const res = await fetch(`${PB_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PB_TOKEN}`,
      ...(options.headers ?? {}),
    },
    signal: AbortSignal.timeout(25_000),
  })

  const body = await res.json()

  if (!res.ok) {
    logger.error({ path, status: res.status }, 'PagBank API error')
    throw new Error(`Erro no gateway PagBank: ${body?.error_messages?.[0]?.description ?? res.statusText}`)
  }

  return body
}

export async function createOrder(params: PBOrderParams) {
  const totalCents = Math.round(params.total * 100)

  const payload: Record<string, unknown> = {
    reference_id: params.externalReference,
    charges: [
      {
        reference_id: params.externalReference,
        amount: { value: totalCents, currency: 'BRL' },
        split: {
          method: 'PERCENT',
          receivers: [
            {
              account: { id: params.receiverAccountId },
              amount: { percent: params.receiverPercent },
            },
          ],
        },
        payment_method: {
          type: params.paymentType.toUpperCase(),
          ...(params.token
            ? { credit_card: { encrypted: params.token, store: false } }
            : {}),
        },
      },
    ],
  }

  logger.info({ externalReference: params.externalReference }, 'Creating PagBank order')
  return pbFetch('/orders', { method: 'POST', body: JSON.stringify(payload) })
}

export async function generatePixQR(amount: number, reference: string) {
  const totalCents = Math.round(amount * 100)

  const body = await pbFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({
      reference_id: reference,
      charges: [
        {
          reference_id: reference,
          amount: { value: totalCents, currency: 'BRL' },
          payment_method: { type: 'PIX', pix: { expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString() } },
        },
      ],
    }),
  })

  const qr = body.charges?.[0]?.payment_method?.pix?.qr_codes?.[0]
  return {
    qrCode: qr?.text ?? '',
    expiresAt: qr?.expiration_date ?? '',
  }
}

export function validateWebhookSignature(signature: string, rawBody: string): boolean {
  const secret = process.env.PB_WEBHOOK_SECRET ?? ''
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return signature === expected
}
