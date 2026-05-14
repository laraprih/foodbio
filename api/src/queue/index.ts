import { Queue } from 'bullmq'
import { bullRedis } from '@/lib/redis'

const defaultJobOptions = {
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
}

export const paymentQueue = new Queue('payment', {
  connection: bullRedis,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
})

export const webhookQueue = new Queue('webhook', {
  connection: bullRedis,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
  },
})

export const notificationQueue = new Queue('notification', {
  connection: bullRedis,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2,
  },
})
