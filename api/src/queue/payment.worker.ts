import { Worker } from 'bullmq'
import { bullRedis } from '@/lib/redis'
import logger from '@/lib/logger'
import { processSplit } from '@/services/split.service'
import { emitToOrder, emitToKitchen, emitToAdmin } from '@/services/socket.service'
import prisma from '@/lib/prisma'

const worker = new Worker(
  'payment',
  async (job) => {
    const { orderId, token, gateway } = job.data as {
      orderId: string
      token: string
      gateway: string
    }

    logger.info({ orderId, gateway, attempt: job.attemptsMade + 1 }, 'Processing payment')

    const transaction = await processSplit({ orderId, token, gateway })

    // Busca dados do pedido para notificar cozinha
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: { select: { name: true } } } } },
    })

    const orderSummary = {
      orderId,
      total: order?.total,
      type: order?.type,
      itemCount: order?.items.length,
      createdAt: order?.createdAt,
    }

    emitToOrder(orderId, 'order:confirmed', { orderId })
    emitToKitchen(order!.tenantId, 'new_order', orderSummary)
    emitToAdmin(order!.tenantId, 'new_order', orderSummary)

    logger.info({ orderId, transactionId: transaction.id }, 'Payment processed successfully')
  },
  {
    connection: bullRedis,
    concurrency: 5,
  }
)

worker.on('failed', async (job, err) => {
  if (!job) return
  const { orderId } = job.data as { orderId: string }
  logger.error({ orderId, err: err.message, attempts: job.attemptsMade }, 'Payment job failed')

  // Notifica cliente apenas na última tentativa
  if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
    emitToOrder(orderId, 'order:payment-failed', {
      orderId,
      message: 'Não foi possível processar o pagamento. Tente novamente.',
    })
  }
})

worker.on('error', (err) => logger.error({ err }, 'Payment worker error'))

export default worker
