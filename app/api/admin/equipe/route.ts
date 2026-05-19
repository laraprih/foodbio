import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/session'
import { getPool } from '@/lib/db'
import argon2 from 'argon2'

const STAFF_ROLES = ['cook', 'attendant', 'driver', 'waiter', 'manager', 'host', 'bartender']

export const STAFF_ROLE_LABEL: Record<string, string> = {
  attendant: 'Operador PDV',
  cook:      'Cozinheiro',
  driver:    'Entregador',
  waiter:    'Garçom',
  manager:   'Gerente',
  host:      'Maître/Recepcionista',
  bartender: 'Barman',
}

// Seções de acesso por cargo (roles sem seção ainda são organizacionais)
export const STAFF_ROLE_SECTION: Record<string, string | null> = {
  attendant: 'pdv',
  cook:      'cozinha',
  driver:    'entregas',
  waiter:    'garcom',
  manager:   null,
  host:      null,
  bartender: null,
}

export async function GET() {
  const session = await auth()
  const tenantId = requireAdmin(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT id, name, email, role, active, "createdAt"
     FROM "User"
     WHERE "tenantId" = $1 AND role = ANY($2::text[])
     ORDER BY role, name`,
    [tenantId, STAFF_ROLES]
  )

  const enriched = rows.map((r: any) => ({
    ...r,
    roleLabel:   STAFF_ROLE_LABEL[r.role]   ?? r.role,
    roleSection: STAFF_ROLE_SECTION[r.role] ?? null,
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const tenantId = requireAdmin(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { name, email, password, role } = body

  if (!name || !email || !password || !STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const pool = getPool()

  const existing = await pool.query('SELECT id FROM "User" WHERE email = $1', [email.toLowerCase().trim()])
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
  }

  const passwordHash = await argon2.hash(password)
  const { rows } = await pool.query(
    `INSERT INTO "User" (id, "tenantId", name, email, "passwordHash", role, active, "createdAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW())
     RETURNING id, name, email, role, active, "createdAt"`,
    [tenantId, name.trim(), email.toLowerCase().trim(), passwordHash, role]
  )

  if (role === 'driver') {
    await pool.query(
      `INSERT INTO "Driver" (id, "userId", "tenantId", vehicle, plate, active)
       VALUES (gen_random_uuid(), $1, $2, 'moto', 'N/A', true)
       ON CONFLICT DO NOTHING`,
      [rows[0].id, tenantId]
    )
  }

  return NextResponse.json(rows[0], { status: 201 })
}
