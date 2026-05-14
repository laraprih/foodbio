import { redis } from '@/lib/redis'
import prisma from '@/lib/prisma'

const TTL = {
  menu: 60,
  tenant: 300,
  report: 300,
}

export async function getMenu(tenantId: string) {
  const key = `menu:${tenantId}`
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)

  const categories = await prisma.category.findMany({
    where: { tenantId, active: true },
    orderBy: { order: 'asc' },
    include: {
      products: {
        where: { available: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          optionGroups: {
            include: { options: { where: { available: true } } },
          },
        },
      },
    },
  })

  await redis.set(key, JSON.stringify(categories), 'EX', TTL.menu)
  return categories
}

export async function invalidateMenu(tenantId: string) {
  await redis.del(`menu:${tenantId}`)
}

export async function getTenant(slug: string) {
  const key = `tenant:${slug}`
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { paymentAccount: true },
  })

  if (tenant) {
    await redis.set(key, JSON.stringify(tenant), 'EX', TTL.tenant)
  }

  return tenant
}

export async function invalidateTenant(slug: string) {
  await redis.del(`tenant:${slug}`)
}

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key)
  return data ? (JSON.parse(data) as T) : null
}

export async function setCache(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

export async function delCache(key: string): Promise<void> {
  await redis.del(key)
}
