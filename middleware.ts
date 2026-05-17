import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_ROUTES = ['/superadmin/dashboard', '/superadmin/empresas']

// Seções protegidas sob /{slug}/
const ADMIN_SECTIONS    = ['dashboard', 'pedidos', 'cardapio', 'financeiro', 'configuracoes', 'relatorios']
const OPERATOR_SECTIONS = ['cozinha', 'pdv', 'entregas']
const ALL_SECTIONS      = [...ADMIN_SECTIONS, ...OPERATOR_SECTIONS]

// Regex: /{slug}/{section}(/{anything})?
const SLUG_ROUTE_RE = new RegExp(
  `^\\/([^\\/]+)\\/(${ALL_SECTIONS.join('|')})(\\/.*)?\$`
)

// Slugs reservados que nunca são empresas
const RESERVED_SLUGS = new Set([
  'api', '_next', 'superadmin', 'login', 'admin', 'favicon.ico',
])

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const sessionToken =
    req.cookies.get('authjs.session-token')?.value ??
    req.cookies.get('__Secure-authjs.session-token')?.value

  // ── Superadmin ──────────────────────────────────────────────────────────────
  if (SUPERADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!sessionToken) {
      const url = new URL('/superadmin/login', req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── Slug-based protected routes ─────────────────────────────────────────────
  const match = pathname.match(SLUG_ROUTE_RE)
  if (match) {
    const slug = match[1]
    if (RESERVED_SLUGS.has(slug)) return NextResponse.next()

    if (!sessionToken) {
      const url = new URL(`/${slug}/admin/login`, req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Superadmin
    '/superadmin/dashboard/:path*',
    '/superadmin/empresas/:path*',
    // Slug-based admin
    '/:slug/dashboard/:path*',
    '/:slug/pedidos/:path*',
    '/:slug/cardapio/:path*',
    '/:slug/financeiro/:path*',
    '/:slug/configuracoes/:path*',
    '/:slug/relatorios/:path*',
    // Slug-based operadores
    '/:slug/cozinha/:path*',
    '/:slug/pdv/:path*',
    '/:slug/entregas/:path*',
  ],
}
