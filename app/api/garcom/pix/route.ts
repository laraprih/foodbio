import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getWaiterSession } from '@/lib/waiter-auth'

export const dynamic = 'force-dynamic'

// GET /api/garcom/pix — retorna dados PIX do restaurante para gerar QR code
export async function GET(req: NextRequest) {
  const session = await getWaiterSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT name, phone, city FROM "Tenant" WHERE id = $1`,
    [session.tenantId]
  )

  if (!rows.length) return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })

  const { name, phone, city } = rows[0]

  return NextResponse.json({
    pixKey: phone ?? null,   // telefone como chave PIX (ex: +5511999999999)
    name:   name  ?? '',
    city:   city  ?? 'Brasil',
  })
}
