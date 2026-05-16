import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import FacebookProvider from 'next-auth/providers/facebook'
import type { JWT } from 'next-auth/jwt'
import { getPool } from '@/lib/db'
import { SignJWT } from 'jose'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function mintFastifyToken(user: { id: string; role: string; tenantId?: string | null }): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'foodin-super-secret-key-2026')
  return new SignJWT({ id: user.id, role: user.role, tenantId: user.tenantId ?? null })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Email e senha',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
        slug: { label: 'Slug', type: 'text' }, // present on customer (store) login
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const pool = getPool()

          if (credentials.slug) {
            // Customer login: find user scoped to this tenant
            const tenantRes = await pool.query('SELECT id FROM "Tenant" WHERE slug = $1 AND active = true', [credentials.slug])
            const tenant = tenantRes.rows[0]
            if (!tenant) return null

            const { rows } = await pool.query(
              'SELECT id, name, email, phone, "passwordHash", role, "tenantId" FROM "User" WHERE email = $1 AND "tenantId" = $2 AND role = \'customer\' AND active = true',
              [credentials.email, tenant.id]
            )
            const user = rows[0]
            if (!user || !user.passwordHash) return null

            const argon2 = await import('argon2')
            const valid = await argon2.verify(user.passwordHash, credentials.password as string)
            if (!valid) return null

            const accessToken = await mintFastifyToken(user)
            return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, tenantId: user.tenantId, accessToken }
          }

          // Admin / superadmin login: global email lookup
          const { rows } = await pool.query(
            'SELECT id, name, email, phone, "passwordHash", role, "tenantId" FROM "User" WHERE email = $1 AND active = true',
            [credentials.email]
          )
          const user = rows[0]
          if (!user || !user.passwordHash) return null

          const argon2 = await import('argon2')
          const valid = await argon2.verify(user.passwordHash, credentials.password as string)
          if (!valid) return null

          const accessToken = await mintFastifyToken(user)
          return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, tenantId: user.tenantId, accessToken }
        } catch {
          if (credentials.slug) return null // never fall back to Fastify for customer login
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { 'Content-Type': 'application/json' },
          })
          if (!res.ok) return null
          const { token, user } = await res.json()
          if (!user?.id) return null
          return { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId, accessToken: token }
        }
      },
    }),

    ...(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            authorization: {
              params: { scope: 'email,public_profile' },
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Credentials login
      if (user) {
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        token.accessToken = (user as any).accessToken
        token.phone = (user as any).phone ?? null
      }

      // Facebook / Instagram login — troca o token FB pelo JWT interno
      if (account?.provider === 'facebook' && account.access_token) {
        try {
          const res = await fetch(`${API_URL}/api/auth/social`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: 'facebook', accessToken: account.access_token }),
          })
          if (res.ok) {
            const body = await res.json()
            token.accessToken = body.token
            token.role = body.user.role
            token.tenantId = body.user.tenantId ?? null
            token.sub = body.user.id
            token.name = body.user.name
            token.email = body.user.email
          }
        } catch {
          // mantém token do NextAuth se a API falhar
        }
      }

      return token
    },

    async session({ session, token }: { session: any; token: JWT }) {
      session.accessToken = token.accessToken
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).tenantId = token.tenantId
        ;(session.user as any).id = token.sub
        ;(session.user as any).phone = token.phone ?? null
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
  },
})
