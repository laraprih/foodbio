import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { JWT } from 'next-auth/jwt'

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

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/auth/login`,
          {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { 'Content-Type': 'application/json' },
          }
        )

        if (!res.ok) return null

        const user = await res.json()
        if (!user?.id) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          accessToken: user.token,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.tenantId = user.tenantId
        token.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }: { session: Parameters<NonNullable<Parameters<typeof NextAuth>[0]['callbacks']>['session']>[0]['session']; token: JWT }) {
      session.accessToken = token.accessToken
      if (session.user) {
        (session.user as typeof session.user & { role?: string; tenantId?: string }).role = token.role
        ;(session.user as typeof session.user & { role?: string; tenantId?: string }).tenantId = token.tenantId
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
