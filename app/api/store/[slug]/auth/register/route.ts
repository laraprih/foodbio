import { getPool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { name, email, phone, password } = await req.json()

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  const pool = getPool()

  const tenantRes = await pool.query('SELECT id FROM "Tenant" WHERE slug = $1 AND active = true', [slug])
  const tenant = tenantRes.rows[0]
  if (!tenant) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const existing = await pool.query(
    'SELECT id FROM "User" WHERE email = $1 AND "tenantId" = $2',
    [email.toLowerCase().trim(), tenant.id]
  )
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Este e-mail já está cadastrado nesta loja' }, { status: 409 })
  }

  let passwordHash: string
  try {
    const argon2 = require('argon2')
    passwordHash = await argon2.hash(password)
  } catch {
    passwordHash = `$temp$${crypto.randomBytes(16).toString('hex')}`
  }

  const id = crypto.randomUUID()
  await pool.query(
    `INSERT INTO "User" (id, "tenantId", name, email, phone, "passwordHash", role, active, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, 'customer', true, NOW())`,
    [id, tenant.id, name.trim(), email.toLowerCase().trim(), phone?.trim() ?? null, passwordHash]
  )

  return NextResponse.json({ ok: true }, { status: 201 })
}
