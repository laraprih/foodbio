import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

function getTenantId(session: any): string | null {
  const user = session?.user as any
  if (!user || user.role !== 'admin' || !user.tenantId) return null
  return user.tenantId
}

export async function GET() {
  const session = await auth()
  const tenantId = getTenantId(session)
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
