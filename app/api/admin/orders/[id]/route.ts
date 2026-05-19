import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireStaff } from '@/lib/session'
import { getPool } from '@/lib/db'
import { serverEmit } from '@/lib/server-emit'

export const dynamic = 'force-dynamic'

const TRANSITIONS: Record<string, string[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['preparing', 'cancelled'],
  preparing:  ['ready', 'cancelled'],
  ready:      ['dispatched', 'delivered'],
  dispatched: ['delivered'],
  delivered:  [],
  cancelled:  [],
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const tenantId = requireStaff(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const nextStatus: string = body.status

  if (!nextStatus || !(nextStatus in TRANSITIONS)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const pool = getPool()

  const { rows } = await pool.query(
    `SELECT status FROM "Order" WHERE id = $1 AND "tenantId" = $2`,
    [id, tenantId]
  )
  if (!rows.length) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  const currentStatus: string = rows[0].status
  const allowed = TRANSITIONS[currentStatus] ?? []

  if (!allowed.includes(nextStatus)) {
    return NextResponse.json(
      { error: `Transição inválida: ${currentStatus} → ${nextStatus}` },
      { status: 422 }
    )
  }

  await pool.query(
    `UPDATE "Order" SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
    [nextStatus, id]
  )

  // Notifica cliente e salas internas em tempo real via Fastify Socket.IO
  const rooms = [`order:${id}`, `admin:${tenantId}`]
  if (['preparing', 'ready', 'dispatched', 'delivered'].includes(nextStatus)) {
    rooms.push(`kitchen:${tenantId}`)
  }
  await serverEmit({
    rooms,
    event: 'order:update',
    data: { orderId: id, status: nextStatus, updatedAt: new Date().toISOString() },
  })

  // Notifica entregadores quando pedido é despachado
  if (nextStatus === 'dispatched') {
    await serverEmit({
      rooms: [`drivers:${tenantId}`],
      event: 'new_delivery',
      data: { orderId: id },
    })
  }

  return NextResponse.json({ ok: true })
}
