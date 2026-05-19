import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'
import { serverEmit } from '@/lib/server-emit'
import { sendOrderConfirmation, normalizeWhatsAppPhone } from '@/lib/whatsapp'

const VALID_METHODS = ['cash', 'pix', 'credit_card', 'debit_card']

async function notifyWhatsApp(pool: any, orderId: string, tenantId: string) {
  const [orderRes, tenantRes] = await Promise.all([
    pool.query(
      `SELECT "customerPhone", "customerName", id FROM "Order" WHERE id = $1`,
      [orderId]
    ),
    pool.query(`SELECT name, slug FROM "Tenant" WHERE id = $1`, [tenantId]),
  ])
  const order  = orderRes.rows[0]
  const tenant = tenantRes.rows[0]
  if (!order?.customerPhone || !tenant) return

  const phone = normalizeWhatsAppPhone(order.customerPhone)
  const { rows: vRows } = await pool.query(
    `SELECT verified FROM "WhatsAppVerification" WHERE phone = $1`,
    [phone]
  )
  if (!vRows[0]?.verified) return

  await sendOrderConfirmation({
    phone,
    customerName: order.customerName ?? '',
    orderId:      order.id,
    orderCode:    order.id.slice(-8).toUpperCase(),
    slug:         tenant.slug,
    tenantName:   tenant.name,
  })
}

// PATCH /api/pdv/orders/[id]/payment — confirma pagamento manual de um pedido
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { paymentMethod, cashSessionId } = body

  if (!VALID_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: 'Método de pagamento inválido' }, { status: 400 })
  }

  const pool = getPool()

  const { rows } = await pool.query(
    `UPDATE "Order"
     SET "paymentStatus" = 'approved',
         "paymentMethod" = $1,
         "cashSessionId" = COALESCE($2, "cashSessionId"),
         "updatedAt"     = NOW()
     WHERE id = $3 AND "tenantId" = $4
     RETURNING id, "paymentStatus", "paymentMethod", status, "tableId", total`,
    [paymentMethod, cashSessionId ?? null, id, session.tenantId]
  )

  if (!rows.length) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  // Libera mesa se pedido de mesa e todos pagos
  const tableId = rows[0].tableId
  if (tableId) {
    const { rows: pending } = await pool.query(
      `SELECT id FROM "Order"
       WHERE "tableId" = $1
         AND "paymentStatus" = 'pending'
         AND status != 'cancelled'
         AND id != $2`,
      [tableId, id]
    )
    if (!pending.length) {
      await pool.query(`UPDATE "Table" SET status = 'free' WHERE id = $1`, [tableId])
    }
  }

  await serverEmit({
    rooms: [`admin:${session.tenantId}`, `kitchen:${session.tenantId}`],
    event: 'order:update',
    data: { orderId: id, paymentStatus: 'approved', paymentMethod },
  })

  // Envia WhatsApp se o cliente tiver número verificado
  notifyWhatsApp(pool, id, session.tenantId).catch(() => {})

  return NextResponse.json({ ok: true, order: rows[0] })
}
