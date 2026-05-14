import { FastifyRequest, FastifyReply } from 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string
      email: string
      role: string
      tenantId: string | null
    }
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.status(401).send({ error: 'Não autenticado. Faça login para continuar.' })
  }
}

export function requireRole(...roles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    await requireAuth(request, reply)
    if (reply.sent) return

    const user = request.user as { role: string }
    if (!roles.includes(user.role)) {
      return reply.status(403).send({ error: 'Acesso negado. Permissão insuficiente.' })
    }
  }
}

export const requireAdmin = requireRole('admin')
export const requireTenantStaff = requireRole('admin', 'attendant')
export const requireCook = requireRole('admin', 'cook')
export const requireDriver = requireRole('driver')
