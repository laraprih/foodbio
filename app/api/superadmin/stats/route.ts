import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'superadmin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const pool = getPool()
  const { rows } = await pool.query(`
    SELECT
      COUNT(*)::int                                              AS total,
      COUNT(*) FILTER (WHERE "planStatus" = 'active')::int      AS active,
      COUNT(*) FILTER (WHERE "planStatus" = 'trial')::int       AS trial,
      COUNT(*) FILTER (WHERE "planStatus" = 'suspended')::int   AS suspended,
      COUNT(*) FILTER (WHERE "planStatus" = 'cancelled')::int   AS cancelled,
      COALESCE(SUM("planPrice") FILTER (WHERE "planStatus" = 'active'), 0)::float AS monthly_revenue
    FROM "Tenant"
  `)

  const s = rows[0]
  return NextResponse.json({
    total: s.total,
    active: s.active,
    trial: s.trial,
    suspended: s.suspended,
    cancelled: s.cancelled,
    monthlyRevenue: s.monthly_revenue,
    annualRevenue: s.monthly_revenue * 12,
  })
}
