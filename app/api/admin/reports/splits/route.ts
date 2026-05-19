import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/session'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  const tenantId = requireAdmin(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()

  const { rows } = await pool.query(
    `SELECT id, "orderId", gateway, "totalAmount", "marketplaceFee",
            "sellerAmount", "splitStatus", "createdAt"
     FROM "PaymentTransaction"
     WHERE "tenantId" = $1
     ORDER BY "createdAt" DESC
     LIMIT 100`,
    [tenantId]
  )

  return NextResponse.json(rows)
}
