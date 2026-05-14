import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const tenantProtectedModels = ['Order', 'Product', 'Category', 'PaymentTransaction']

prisma.$use(async (params, next) => {
  if (
    params.model &&
    tenantProtectedModels.includes(params.model) &&
    params.action === 'findMany' &&
    !params.args?.where?.tenantId
  ) {
    throw new Error(
      `Query ${params.model}.findMany executada sem tenantId. Adicione { where: { tenantId } } para isolamento multi-tenant.`
    )
  }
  return next(params)
})

export default prisma
