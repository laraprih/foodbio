import prisma from '@/lib/prisma'
import logger from '@/lib/logger'
import { getPaymentAccount } from './tenant.service'
import * as mp from './mercadopago.service'
import * as pb from './pagbank.service'

export async function processSplit(params: {
  orderId: string
  token: string
  gateway: string
  payerEmail?: string
}) {
  const { orderId, token, gateway, payerEmail = 'cliente@foodin.com.br' } = params

  // Idempotência: não reprocessar pedido já pago
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { paymentTransaction: true },
  })

  if (!existing) {
    throw new Error('Pedido não encontrado')
  }

  if (existing.paymentStatus !== 'pending') {
    logger.warn({ orderId, paymentStatus: existing.paymentStatus }, 'Tentativa de pagamento duplicado')
    if (existing.paymentTransaction) return existing.paymentTransaction
    throw new Error('Pedido já foi processado')
  }

  const account = await getPaymentAccount(existing.tenantId)

  const marketplaceFee = Number((existing.total * (account.commissionPercent / 100)).toFixed(2))
  const sellerAmount = Number((existing.total - marketplaceFee).toFixed(2))

  let gatewayResponse: Record<string, unknown>
  let gatewayTransactionId: string | undefined

  try {
    if (gateway === 'mercadopago') {
      gatewayResponse = await mp.createOrder({
        total: existing.total,
        marketplaceFee,
        paymentMethodId: token ? 'credit_card' : 'pix',
        token: token || undefined,
        externalReference: `foodin_${orderId}`,
        payerEmail,
      })
      gatewayTransactionId = String((gatewayResponse as Record<string, unknown>).id ?? '')
    } else if (gateway === 'pagbank') {
      gatewayResponse = await pb.createOrder({
        total: existing.total,
        receiverAccountId: account.externalAccountId,
        receiverPercent: account.commissionPercent === 8 ? 92 : 100 - account.commissionPercent,
        token: token || undefined,
        paymentType: token ? 'credit_card' : 'pix',
        externalReference: `foodin_${orderId}`,
      })
      const charge = (gatewayResponse.charges as Record<string, unknown>[])?.[0]
      gatewayTransactionId = String(charge?.id ?? '')
    } else {
      throw new Error(`Gateway desconhecido: ${gateway}`)
    }
  } catch (err) {
    // Registrar falha sem expor payload completo
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'failed' },
      }),
      prisma.paymentTransaction.create({
        data: {
          orderId,
          tenantId: existing.tenantId,
          gateway,
          totalAmount: existing.total,
          marketplaceFee,
          sellerAmount,
          splitStatus: 'failed',
        },
      }),
    ])
    throw err
  }

  const [transaction] = await prisma.$transaction([
    prisma.paymentTransaction.create({
      data: {
        orderId,
        tenantId: existing.tenantId,
        gateway,
        gatewayTransactionId,
        totalAmount: existing.total,
        marketplaceFee,
        sellerAmount,
        splitStatus: 'pending',
        payloadResponse: gatewayResponse as object,
        processedAt: new Date(),
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'approved',
        status: 'confirmed',
        externalReference: `foodin_${orderId}`,
      },
    }),
  ])

  logger.info({ orderId, gateway, marketplaceFee, sellerAmount }, 'Split payment processed')
  return transaction
}
