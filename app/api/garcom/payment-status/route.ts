import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getWaiterSession } from '@/lib/waiter-auth'

export const dynamic = 'force-dynamic'

// GET /api/garcom/payment-status?tableId=... — verifica se a mesa já foi paga
// Usado para polling enquanto o cliente escaneia o QR code PIX
export async function GET(req: NextRequest) {
  const session = await getWaiterSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const tableId = req.nextUrl.searchParams.get('tableId')
  if (!tableId) return NextResponse.json({ error: 'tableId obrigatório' }, { status: 400 })

  const pool = getPool()

  // Verifica se o webhook já aprovou algum pedido dessa mesa nos últimos 10 min
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS approved, SUM(total) AS total
     FROM "Order"
     WHERE "tableId"      = $1
       AND "tenantId"     = $2
       AND "paymentStatus" = 'approved'
       AND "updatedAt"    >= NOW() - INTERVAL '10 minutes'`,
    [tableId, session.tenantId]
  )

  const approved = Number(rows[0]?.approved ?? 0)
  const total    = Number(rows[0]?.total    ?? 0)

  return NextResponse.json({ paid: approved > 0, total })
}
