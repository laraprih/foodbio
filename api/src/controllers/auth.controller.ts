import { FastifyRequest, FastifyReply } from 'fastify'
import prisma from '@/lib/prisma'
import argon2 from 'argon2'

interface LoginBody {
  email: string
  password: string
}

export async function login(request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) {
  const { email, password } = request.body

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.passwordHash) {
    return reply.status(401).send({ error: 'E-mail ou senha incorretos' })
  }

  const valid = await argon2.verify(user.passwordHash, password)
  if (!valid) {
    return reply.status(401).send({ error: 'E-mail ou senha incorretos' })
  }

  const token = await reply.jwtSign(
    { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    { expiresIn: '7d' }
  )

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
}
