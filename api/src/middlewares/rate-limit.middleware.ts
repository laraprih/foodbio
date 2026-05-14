import { FastifyRequest } from 'fastify'

export const limits = {
  publicMenu:  { max: 200, timeWindow: '1 minute' },
  createOrder: { max: 30,  timeWindow: '1 minute' },
  payOrder:    { max: 10,  timeWindow: '1 minute' },
  admin:       { max: 100, timeWindow: '1 minute' },
  auth:        { max: 10,  timeWindow: '1 minute' },
}

export function tenantKeyGenerator(request: FastifyRequest): string {
  const user = (request as FastifyRequest & { user?: { tenantId?: string } }).user
  return `tenant:${user?.tenantId ?? request.ip}`
}
