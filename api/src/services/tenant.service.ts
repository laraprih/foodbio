import prisma from '@/lib/prisma'
import { getTenant, invalidateTenant } from './cache.service'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY ?? '0'.repeat(64), 'hex')
const ALGORITHM = 'aes-256-gcm'

export function encryptToken(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptToken(encrypted: string): string {
  const buf = Buffer.from(encrypted, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
  decipher.setAuthTag(tag)
  return decipher.update(data) + decipher.final('utf8')
}

export async function resolveTenant(slugOrId: string) {
  const bySlug = await getTenant(slugOrId)
  if (bySlug) return bySlug

  return prisma.tenant.findUnique({
    where: { id: slugOrId },
    include: { paymentAccount: true },
  })
}

export async function getPaymentAccount(tenantId: string) {
  const account = await prisma.tenantPaymentAccount.findUnique({
    where: { tenantId },
  })

  if (!account) {
    throw new Error('Restaurante sem conta de pagamento configurada. Acesse o dashboard e conecte sua conta.')
  }

  if (account.onboardingStatus !== 'active') {
    throw new Error('Conta de pagamento pendente ou suspensa. Verifique o status no dashboard.')
  }

  return {
    ...account,
    accessToken: decryptToken(account.accessToken),
  }
}

export async function savePaymentAccount(params: {
  tenantId: string
  gateway: string
  externalAccountId: string
  accessToken: string
  refreshToken?: string
}) {
  const encrypted = encryptToken(params.accessToken)

  await prisma.tenantPaymentAccount.upsert({
    where: { tenantId: params.tenantId },
    create: {
      tenantId: params.tenantId,
      gateway: params.gateway,
      externalAccountId: params.externalAccountId,
      accessToken: encrypted,
      refreshToken: params.refreshToken,
      onboardingStatus: 'active',
    },
    update: {
      externalAccountId: params.externalAccountId,
      accessToken: encrypted,
      refreshToken: params.refreshToken,
      onboardingStatus: 'active',
      updatedAt: new Date(),
    },
  })

  // Invalida cache pois gateway mudou
  const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } })
  if (tenant) await invalidateTenant(tenant.slug)
}
