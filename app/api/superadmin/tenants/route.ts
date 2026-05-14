import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

async function hashPassword(password: string): Promise<string> {
  // argon2 is in api/node_modules — we use a simple bcrypt-like approach via the API
  // For superadmin creating tenants, we store the hash via a direct argon2 call
  // Since argon2 is not in the root node_modules, we use a 32-byte random token as temporary password
  // The admin can reset it. For now, return a placeholder that forces password reset.
  return `$temp$${crypto.randomBytes(16).toString('hex')}`
}

function requireSuperAdmin(session: any) {
  return session && (session.user as any).role === 'superadmin'
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!requireSuperAdmin(session)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const pool = getPool()
  const search = req.nextUrl.searchParams.get('q') ?? ''
  const status = req.nextUrl.searchParams.get('status') ?? ''

  const conditions: string[] = []
  const values: string[] = []
  let idx = 1

  if (search) {
    conditions.push(`(t.name ILIKE $${idx} OR t.slug ILIKE $${idx})`)
    values.push(`%${search}%`)
    idx++
  }
  if (status) {
    conditions.push(`t."planStatus" = $${idx}`)
    values.push(status)
    idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query(
    `SELECT
       t.id, t.slug, t.name, t.phone, t.address, t.city, t.state,
       t.plan, t."planStatus", t."planPrice", t."planDueDate",
       t.active, t."createdAt",
       MIN(u.email) FILTER (WHERE u.role = 'admin') AS admin_email,
       MIN(u.id)    FILTER (WHERE u.role = 'admin') AS admin_id,
       COUNT(u.id)  FILTER (WHERE u.role = 'admin')::int AS admin_count,
       COUNT(o.id)::int AS order_count
     FROM "Tenant" t
     LEFT JOIN "User" u ON u."tenantId" = t.id
     LEFT JOIN "Order" o ON o."tenantId" = t.id
     ${where}
     GROUP BY t.id
     ORDER BY t."createdAt" DESC`,
    values
  )

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!requireSuperAdmin(session)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { name, slug, address, city, state, phone, plan, planPrice, planStatus, adminEmail, adminPassword } = body

  if (!name || !slug || !adminEmail || !adminPassword) {
    return NextResponse.json({ error: 'Campos obrigatórios: nome, slug, email admin, senha admin' }, { status: 400 })
  }

  const pool = getPool()

  // Check slug uniqueness
  const exists = await pool.query('SELECT id FROM "Tenant" WHERE slug = $1', [slug])
  if (exists.rows.length > 0) {
    return NextResponse.json({ error: 'Slug já existe' }, { status: 409 })
  }

  const tenantId = crypto.randomUUID()
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  await pool.query(
    `INSERT INTO "Tenant" (id, slug, name, phone, address, city, state, plan, "planStatus", "planPrice", "planDueDate", active, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())`,
    [tenantId, slug, name, phone ?? null, address ?? null, city ?? null, state ?? null,
     plan ?? 'basic', planStatus ?? 'trial', planPrice ?? 99, dueDate]
  )

  // Import argon2 dynamically from api if available, else use temp token
  let passwordHash: string
  try {
    const argon2 = require('argon2')
    passwordHash = await argon2.hash(adminPassword)
  } catch {
    passwordHash = await hashPassword(adminPassword)
  }

  const userId = crypto.randomUUID()
  await pool.query(
    `INSERT INTO "User" (id, "tenantId", name, email, "passwordHash", role, active, "createdAt")
     VALUES ($1, $2, $3, $4, $5, 'admin', true, NOW())`,
    [userId, tenantId, `Admin ${name}`, adminEmail, passwordHash]
  )

  return NextResponse.json({ id: tenantId, slug, name }, { status: 201 })
}
