import { NextRequest, NextResponse } from 'next/server'

const ADMIN_ROUTES = ['/dashboard', '/pedidos', '/cardapio', '/financeiro', '/configuracoes', '/relatorios']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isAdminRoute = ADMIN_ROUTES.some(r => pathname.startsWith(r))
  if (!isAdminRoute) return NextResponse.next()

  // NextAuth v5 stores the session token in these cookies
  const sessionToken =
    req.cookies.get('authjs.session-token')?.value ??
    req.cookies.get('__Secure-authjs.session-token')?.value

  if (!sessionToken) {
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

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
