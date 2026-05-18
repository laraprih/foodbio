import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'
import { serverEmit } from '@/lib/server-emit'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const pdvSession = await getPDVSession(req)
  if (!pdvSession) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const {
    items,              // [{ productId, quantity, unitPrice, options, notes }]
    orderType,          // pickup | delivery | in_store
    customerName,
    customerPhone,
    address,            // only for delivery
    tableId,            // only for in_store
    cashSessionId,
    payments,           // [{ method, amount }]
    discount = 0,
    deliveryFee = 0,
  } = body

  if (!items?.length || !orderType || !payments?.length) {
    return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 })
  }

  // Validate products and build item list
  let subtotal = 0
  const itemDetails: {
    productId: string; quantity: number; unitPrice: number;
    totalPrice: number; notes: string; options: any[]
  }[] = []

  for (const item of items) {
    const { rows: pRows } = await pool.query(
      `SELECT id, price FROM "Product"
       WHERE id = $1 AND "tenantId" = $2 AND available = true`,
      [item.productId, pdvSession.tenantId]
    )
    if (!pRows.length) {
      return NextResponse.json({ error: `Produto indisponível: ${item.productId}` }, { status: 400 })
    }
    const unitPrice = Number(item.unitPrice)  // includes option price modifiers
    const totalPrice = unitPrice * item.quantity
    subtotal += totalPrice
    itemDetails.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      notes: item.notes ?? '',
      options: item.options ?? [],
    })
  }

  const discountAmount = Math.min(Number(discount), subtotal)
  const fee = orderType === 'delivery' ? Number(deliveryFee) : 0
  const total = Math.max(0, subtotal - discountAmount + fee)
  const orderId = randomUUID()

  // Map orderType to DB type
  const dbType = orderType === 'delivery' ? 'delivery'
    : orderType === 'in_store' ? 'in_store'
    : 'pickup'

  // PDV orders are always paid immediately (approved status)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `INSERT INTO "Order" (
        id, "tenantId", type, status, total, subtotal, "deliveryFee", discount,
        "paymentStatus", "paymentMethod", "deliveryAddress",
        "customerName", "customerPhone", "tableId", "cashSessionId",
        "createdAt", "updatedAt"
       ) VALUES ($1,$2,$3,'confirmed',$4,$5,$6,$7,'approved',$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
      [
        orderId, pdvSession.tenantId, dbType,
        total, subtotal, fee, discountAmount,
        payments[0]?.method ?? 'cash',
        address ? JSON.stringify(address) : null,
        customerName?.trim() || 'Balcão',
        customerPhone?.trim() || null,
        tableId ?? null,
        cashSessionId ?? null,
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

    // Update table status if dine-in
    if (tableId) {
      await client.query(
        `UPDATE "Table" SET status = 'occupied' WHERE id = $1 AND "tenantId" = $2`,
        [tableId, pdvSession.tenantId]
      )
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[pdv/orders] DB error:', err)
    return NextResponse.json({ error: 'Erro ao salvar pedido' }, { status: 500 })
  } finally {
    client.release()
  }

  await serverEmit({
    rooms: [`kitchen:${pdvSession.tenantId}`, `admin:${pdvSession.tenantId}`],
    event: 'new_order',
    data: { orderId, total, type: dbType, itemCount: itemDetails.length, status: 'confirmed' },
  })

  return NextResponse.json({ orderId })
}
