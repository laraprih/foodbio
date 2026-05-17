import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_ROUTES = ['/superadmin/dashboard', '/superadmin/empresas']

// Mapeamento: seção → login path relativo ao slug
const SECTION_LOGIN: Record<string, string> = {
  dashboard:     'admin/login',
  pedidos:       'admin/login',
  cardapio:      'admin/login',
  financeiro:    'admin/login',
  configuracoes: 'admin/login',
  relatorios:    'admin/login',
  equipe:        'admin/login',
  cozinha:       'cozinha/login',
  pdv:           'pdv/login',
  entregas:      'entregador/login',
}

const ALL_SECTIONS = Object.keys(SECTION_LOGIN)

// Regex: /{slug}/{seção}(/{qualquer coisa})?
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
    const slug    = match[1]
    const section = match[2]

    if (RESERVED_SLUGS.has(slug)) return NextResponse.next()

    // Ignorar as próprias páginas de login para não criar loop
    const loginSuffix = SECTION_LOGIN[section]
    if (pathname === `/${slug}/${loginSuffix}`) return NextResponse.next()

    if (!sessionToken) {
      const url = new URL(`/${slug}/${loginSuffix}`, req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Superadmin
    '/superadmin/dashboard(.*)',
    '/superadmin/empresas(.*)',
    // Slug-based admin
    '/:slug/dashboard(.*)',
    '/:slug/pedidos(.*)',
    '/:slug/cardapio(.*)',
    '/:slug/financeiro(.*)',
    '/:slug/configuracoes(.*)',
    '/:slug/relatorios(.*)',
    '/:slug/equipe(.*)',
    // Slug-based operadores
    '/:slug/cozinha(.*)',
    '/:slug/pdv(.*)',
    '/:slug/entregas(.*)',
  ],
}
