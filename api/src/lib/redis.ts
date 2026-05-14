import Redis from 'ioredis'
import logger from './logger'

const url = process.env.REDIS_URL ?? 'redis://localhost:6379'

// Instância geral (queries, cache, rate limiting)
export const redis = new Redis(url, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 200, 3000),
})

// Instância dedicada ao BullMQ (exige maxRetriesPerRequest: null)
export const bullRedis = new Redis(url, {
  lazyConnect: true,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 200, 3000),
})

redis.on('error', (err) => logger.error({ err }, 'Redis connection error'))
bullRedis.on('error', (err) => logger.error({ err }, 'BullMQ Redis connection error'))

export default redis
