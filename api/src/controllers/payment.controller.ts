import { FastifyRequest, FastifyReply } from 'fastify'
import { savePaymentAccount, resolveTenant } from '@/services/tenant.service'
import { exchangeOAuthCode } from '@/services/mercadopago.service'
import { validateWebhookSignature as validateMP } from '@/services/mercadopago.service'
import { validateWebhookSignature as validatePB } from '@/services/pagbank.service'
import { webhookQueue } from '@/queue/index'
import prisma from '@/lib/prisma'

export async function getPaymentStatus(request: FastifyRequest, reply: FastifyReply) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const account = await prisma.tenantPaymentAccount.findUnique({ where: { tenantId: tenant.id } })

  if (!account) return { configured: false }

  return {
    configured: true,
    gateway: account.gateway,
    status: account.onboardingStatus,
    commissionPercent: account.commissionPercent,
  }
}

export async function getMpAuthorizeUrl(request: FastifyRequest, reply: FastifyReply) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant
  const state = await reply.jwtSign({ tenantId: tenant.id }, { expiresIn: '10m' })

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.MP_CLIENT_ID ?? '',
    redirect_uri: process.env.MP_REDIRECT_URI ?? '',
    state,
  })

  return { url: `https://auth.mercadopago.com/authorization?${params}` }
}

export async function mpCallback(
  request: FastifyRequest<{ Querystring: { code: string; state: string } }>,
  reply: FastifyReply
) {
  const { code, state } = request.query

  let tenantId: string
  try {
    const decoded = await request.jwtVerify<{ tenantId: string }>()
    void decoded // verifica assinatura
    const payload = request.server.jwt.decode<{ tenantId: string }>(state)
    tenantId = payload?.tenantId ?? ''
  } catch {
    return reply.status(400).send({ error: 'State inválido' })
  }

  const { accessToken, userId } = await exchangeOAuthCode(code)

  await savePaymentAccount({
    tenantId,
    gateway: 'mercadopago',
    externalAccountId: userId,
    accessToken,
  })

  return reply.redirect('/admin/financeiro?success=true')
}

export async function connectPagBank(
  request: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply
) {
  const tenant = (request as FastifyRequest & { tenant: { id: string } }).tenant

  // Em produção: chamar API PagBank para vincular conta
  // Por ora: salvar com status pending para ativação manual
  await savePaymentAccount({
    tenantId: tenant.id,
    gateway: 'pagbank',
    externalAccountId: request.body.email,
    accessToken: 'PENDING',
  })

  return { success: true, message: 'Conta PagBank vinculada. Aguardando ativação.' }
}

export async function handleWebhookMP(request: FastifyRequest, reply: FastifyReply) {
  const signature = (request.headers['x-signature'] as string) ?? ''
  const requestId = (request.headers['x-request-id'] as string) ?? ''
  const rawBody = JSON.stringify(request.body)

  if (!validateMP(signature, requestId, rawBody)) {
    return reply.status(401).send({ error: 'Assinatura inválida' })
  }

  // Responde imediatamente (< 100ms), processa em background
  await webhookQueue.add('mp', { gateway: 'mercadopago', payload: request.body })
  return reply.status(200).send({ received: true })
}

export async function handleWebhookPB(request: FastifyRequest, reply: FastifyReply) {
  const signature = (request.headers['x-pagseguro-signature'] as string) ?? ''
  const rawBody = JSON.stringify(request.body)

  if (!validatePB(signature, rawBody)) {
    return reply.status(401).send({ error: 'Assinatura inválida' })
  }

  await webhookQueue.add('pb', { gateway: 'pagbank', payload: request.body })
  return reply.status(200).send({ received: true })
}
