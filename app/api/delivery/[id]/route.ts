import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { serverEmit } from '@/lib/server-emit'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const user = session?.user as any
  if (!user || user.role !== 'driver') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const action: string = body.action // 'pickup' | 'deliver'

  if (!['pickup', 'deliver'].includes(action)) {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }

  const pool = getPool()

  const driverRes = await pool.query(
    `SELECT id FROM "Driver" WHERE "userId" = $1 AND active = true`,
    [user.id]
  )
  if (!driverRes.rows.length) {
    return NextResponse.json({ error: 'Entregador não encontrado' }, { status: 404 })
  }
  const driverId = driverRes.rows[0].id

  const deliveryRes = await pool.query(
    `SELECT d.id, d.status, d."orderId", o."tenantId"
     FROM "Delivery" d
     JOIN "Order" o ON o.id = d."orderId"
     WHERE d.id = $1 AND d."driverId" = $2`,
    [id, driverId]
  )
  if (!deliveryRes.rows.length) {
    return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 })
  }
  const delivery = deliveryRes.rows[0]
  const { orderId, tenantId } = delivery

  if (action === 'pickup') {
    if (delivery.status !== 'assigned') {
      return NextResponse.json({ error: 'Entrega não está no status correto para coleta' }, { status: 400 })
    }
    await pool.query(
      `UPDATE "Delivery" SET status = 'picked_up', "pickupTime" = NOW() WHERE id = $1`,
      [id]
    )
    await serverEmit({
      rooms: [`order:${orderId}`, `admin:${tenantId}`],
      event: 'order:update',
      data: { orderId, status: 'dispatched', updatedAt: new Date().toISOString() },
    })
  } else {
    if (delivery.status !== 'picked_up') {
      return NextResponse.json({ error: 'Pedido ainda não foi coletado' }, { status: 400 })
    }
    await pool.query(
      `UPDATE "Delivery" SET status = 'delivered', "deliveryTime" = NOW() WHERE id = $1`,
      [id]
    )
    await pool.query(
      `UPDATE "Order" SET status = 'delivered', "updatedAt" = NOW() WHERE id = $1`,
      [orderId]
    )
    await serverEmit({
      rooms: [`order:${orderId}`, `admin:${tenantId}`],
      event: 'order:update',
      data: { orderId, status: 'delivered', updatedAt: new Date().toISOString() },
    })
  }

  return NextResponse.json({ ok: true })
}
