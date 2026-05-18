import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT name, "deliveryFee", "minOrderValue", "deliveryRadius", phone, address, "logoUrl"
     FROM "Tenant" WHERE id = $1`,
    [session.tenantId]
  )

  if (!rows.length) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
  return NextResponse.json({ tenant: rows[0] })
}
