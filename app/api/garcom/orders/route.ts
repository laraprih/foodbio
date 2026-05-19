import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getWaiterSession } from '@/lib/waiter-auth'
import { serverEmit } from '@/lib/server-emit'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

// POST /api/garcom/orders — cria novo pedido para a mesa
// Pedidos do garçom: status=confirmed, paymentStatus=pending (PDV fecha o pagamento)
export async function POST(req: NextRequest) {
  const session = await getWaiterSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { tableId, items, customerName, notes } = body

  if (!tableId || !items?.length) {
    return NextResponse.json({ error: 'Mesa e itens são obrigatórios' }, { status: 400 })
  }

  const pool = getPool()

  // Validar mesa
  const { rows: tableRows } = await pool.query(
    `SELECT id, status FROM "Table"
     WHERE id = $1 AND "tenantId" = $2 AND active = true`,
    [tableId, session.tenantId]
  )
  if (!tableRows.length) {
    return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 })
  }

  // Validar e calcular itens
  let subtotal = 0
  const itemDetails: {
    productId: string; quantity: number; unitPrice: number;
    totalPrice: number; notes: string; options: any[]
  }[] = []

  for (const item of items) {
    const { rows: pRows } = await pool.query(
      `SELECT id, price FROM "Product"
       WHERE id = $1 AND "tenantId" = $2 AND available = true`,
      [item.productId, session.tenantId]
    )
    if (!pRows.length) {
      return NextResponse.json({ error: `Produto indisponível: ${item.productId}` }, { status: 400 })
    }
    const unitPrice  = Number(item.unitPrice)
    const totalPrice = unitPrice * item.quantity
    subtotal += totalPrice
    itemDetails.push({
      productId: item.productId,
      quantity:  item.quantity,
      unitPrice,
      totalPrice,
      notes:   item.notes ?? '',
      options: item.options ?? [],
    })
  }

  const orderId = randomUUID()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `INSERT INTO "Order" (
         id, "tenantId", type, status, total, subtotal,
         "deliveryFee", discount, "paymentStatus", "tableId",
         "customerName", notes, "createdAt", "updatedAt"
       ) VALUES ($1,$2,'in_store','confirmed',$3,$3,0,0,'pending',$4,$5,$6,NOW(),NOW())`,
      [
        orderId, session.tenantId,
        subtotal,
        tableId,
        customerName?.trim() || `Mesa ${tableRows[0].number ?? ''}`,
        notes?.trim() || null,
      ]
    )

    for (const item of itemDetails) {
      const itemId = randomUUID()
      await client.query(
        `INSERT INTO "OrderItem" (id, "orderId", "productId", quantity, "unitPrice", "totalPrice", notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [itemId, orderId, item.productId, item.quantity, item.unitPrice, item.totalPrice, item.notes]
      )

      for (const opt of item.options) {
        await client.query(
          `INSERT INTO "OrderItemOption" (id, "orderItemId", "optionId", name, price)
           VALUES ($1,$2,$3,$4,$5)`,
          [randomUUID(), itemId, opt.optionId, opt.name, opt.priceModifier ?? 0]
        )
      }
    }

    // Marcar mesa como ocupada (se ainda estava livre)
    if (tableRows[0].status === 'free') {
      await client.query(
        `UPDATE "Table" SET status = 'occupied' WHERE id = $1`,
        [tableId]
      )
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[garcom/orders] DB error:', err)
    return NextResponse.json({ error: 'Erro ao salvar pedido' }, { status: 500 })
  } finally {
    client.release()
  }

  // Emite para cozinha e admin em tempo real
  await serverEmit({
    rooms: [`kitchen:${session.tenantId}`, `admin:${session.tenantId}`, `pdv:${session.tenantId}`],
    event: 'new_order',
    data: {
      orderId,
      total: subtotal,
      type: 'in_store',
      itemCount: itemDetails.length,
      status: 'confirmed',
      source: 'garcom',
      waiterName: session.name,
    },
  })

  return NextResponse.json({ orderId, total: subtotal }, { status: 201 })
}
