import { Worker } from 'bullmq'
import { bullRedis } from '@/lib/redis'
import logger from '@/lib/logger'
import prisma from '@/lib/prisma'
import { emitToAdmin } from '@/services/socket.service'

const worker = new Worker(
  'webhook',
  async (job) => {
    const { gateway, payload } = job.data as { gateway: string; payload: Record<string, unknown> }

    logger.info({ gateway, jobId: job.id }, 'Processing webhook')

    const eventType = String(
      gateway === 'mercadopago'
        ? (payload.action ?? payload.type)
        : (payload as Record<string, unknown>).type
    )

    const externalId = String(
      gateway === 'mercadopago'
        ? ((payload.data as Record<string, unknown>)?.id ?? '')
        : ((payload as Record<string, unknown>).id ?? '')
    )

    if (!externalId) {
      logger.warn({ gateway, payload }, 'Webhook sem ID de transação')
      return
    }

    const transaction = await prisma.paymentTransaction.findFirst({
      where: { gatewayTransactionId: externalId },
    })

    if (!transaction) {
      logger.warn({ externalId }, 'Transação não encontrada para webhook')
      return
    }

    if (eventType.includes('approved') || eventType.includes('paid')) {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { splitStatus: 'done' },
      })
    } else if (eventType.includes('refund')) {
      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: { splitStatus: 'refunded' },
        }),
        prisma.order.update({
          where: { id: transaction.orderId },
          data: { paymentStatus: 'refunded' },
        }),
      ])
    } else if (eventType.includes('chargeback') || eventType.includes('dispute')) {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { splitStatus: 'chargeback' },
      })
      emitToAdmin(transaction.tenantId, 'chargeback_alert', {
        orderId: transaction.orderId,
        amount: transaction.totalAmount,
        gateway,
      })
    }

    logger.info({ externalId, eventType, splitStatus: transaction.splitStatus }, 'Webhook processed')
  },
  {
    connection: bullRedis,
    concurrency: 10,
  }
)

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Webhook job failed')
})

export default worker
