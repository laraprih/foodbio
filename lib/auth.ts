import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import FacebookProvider from 'next-auth/providers/facebook'
import type { JWT } from 'next-auth/jwt'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Email e senha',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { 'Content-Type': 'application/json' },
        })

        if (!res.ok) return null

        const body = await res.json()
        const { token, user } = body
        if (!user?.id) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          accessToken: token,
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
