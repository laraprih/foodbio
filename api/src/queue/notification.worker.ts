import { Worker } from 'bullmq'
import { bullRedis } from '@/lib/redis'
import logger from '@/lib/logger'
import { emitToOrder } from '@/services/socket.service'

const worker = new Worker(
  'notification',
  async (job) => {
    const { type, orderId, payload } = job.data as {
      type: string
      orderId: string
      payload: Record<string, unknown>
    }

    logger.info({ type, orderId, jobId: job.id }, 'Processing notification')

    switch (type) {
      case 'order_status_changed':
        emitToOrder(orderId, 'order:status', payload)
        break
      case 'payment_failed':
        emitToOrder(orderId, 'order:payment-failed', payload)
        break
      case 'delivery_assigned':
        emitToOrder(orderId, 'order:delivery-assigned', payload)
        break
      default:
        logger.warn({ type }, 'Unknown notification type')
    }
  },
  {
    connection: bullRedis,
    concurrency: 20,
  }
)

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Notification job failed')
})

export default worker
