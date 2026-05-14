import { NextRequest, NextResponse } from 'next/server'

const ADMIN_ROUTES     = ['/dashboard', '/pedidos', '/cardapio', '/financeiro', '/configuracoes', '/relatorios']
const SUPERADMIN_ROUTES = ['/superadmin/dashboard', '/superadmin/empresas']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const sessionToken =
    req.cookies.get('authjs.session-token')?.value ??
    req.cookies.get('__Secure-authjs.session-token')?.value

  const isAdminRoute      = ADMIN_ROUTES.some(r => pathname.startsWith(r))
  const isSuperAdminRoute = SUPERADMIN_ROUTES.some(r => pathname.startsWith(r))

  if ((isAdminRoute || isSuperAdminRoute) && !sessionToken) {
    const loginPath = isSuperAdminRoute ? '/superadmin/login' : '/admin/login'
    const loginUrl  = new URL(loginPath, req.url)
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
    '/superadmin/dashboard/:path*',
    '/superadmin/empresas/:path*',
  ],
}
