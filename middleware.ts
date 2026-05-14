import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const ADMIN_ROUTES = ['/dashboard', '/pedidos', '/cardapio', '/financeiro', '/configuracoes', '/relatorios']

export default auth((req) => {
  const { nextUrl } = req
  const session = (req as any).auth

  const isAdminRoute = ADMIN_ROUTES.some(r => nextUrl.pathname.startsWith(r))
  if (isAdminRoute && !session) {
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pedidos/:path*',
    '/cardapio/:path*',
    '/financeiro/:path*',
    '/configuracoes/:path*',
    '/relatorios/:path*',
  ],
}
