import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ customers: [] })

  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.phone, u.email
     FROM "User" u
     WHERE u."tenantId" = $1
       AND u.role = 'customer'
       AND u.active = true
       AND (u.name ILIKE $2 OR u.phone ILIKE $2)
     ORDER BY u.name ASC
     LIMIT 8`,
    [session.tenantId, `%${q}%`]
  )

  return NextResponse.json({ customers: rows })
}
