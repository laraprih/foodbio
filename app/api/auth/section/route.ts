import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { SignJWT, jwtVerify } from 'jose'

type Section = 'pdv' | 'cozinha' | 'entregador' | 'garcom'

const SECTION_ROLE: Record<Section, string> = {
  pdv: 'attendant',
  cozinha: 'cook',
  entregador: 'driver',
  garcom: 'waiter',
}

const SECTION_COOKIE: Record<Section, string> = {
  pdv: 'pdv_session',
  cozinha: 'cozinha_session',
  entregador: 'entregador_session',
  garcom: 'garcom_session',
}

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? 'foodin-super-secret-key-2026')
}

// POST /api/auth/section — faz login na seção, seta cookie próprio
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password, section, slug } = body as {
    email: string; password: string; section: string; slug: string
  }

  if (!email || !password || !section || !slug || !(section in SECTION_ROLE)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const allowedRole = SECTION_ROLE[section as Section]

  try {
    const pool = getPool()

    const tenantRes = await pool.query(
      'SELECT id, name FROM "Tenant" WHERE slug = $1 AND active = true',
      [slug]
    )
    const tenant = tenantRes.rows[0]
    if (!tenant) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const { rows } = await pool.query(
      `SELECT id, name, email, "passwordHash", role, "tenantId"
       FROM "User"
       WHERE email = $1 AND "tenantId" = $2 AND role = $3 AND active = true`,
      [email.toLowerCase().trim(), tenant.id, allowedRole]
    )

    const user = rows[0]
    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const argon2 = await import('argon2')
    const valid = await argon2.verify(user.passwordHash, password as string)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const token = await new SignJWT({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: tenant.name,
      section,
      slug,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret())

    const cookieName = SECTION_COOKIE[section as Section]
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId, tenantName: tenant.name },
    })
    res.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (err) {
    console.error('[section-login]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET /api/auth/section?section=pdv — retorna sessão ativa
export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get('section') as Section | null

  if (!section || !(section in SECTION_COOKIE)) {
    return NextResponse.json({ error: 'Seção inválida' }, { status: 400 })
  }

  const token = req.cookies.get(SECTION_COOKIE[section])?.value
  if (!token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const { payload } = await jwtVerify(token, secret())
    return NextResponse.json({ user: payload })
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }
}

// DELETE /api/auth/section?section=pdv — logout
export async function DELETE(req: NextRequest) {
  const section = req.nextUrl.searchParams.get('section') as Section | null

  if (!section || !(section in SECTION_COOKIE)) {
    return NextResponse.json({ error: 'Seção inválida' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SECTION_COOKIE[section])
  return res
}
