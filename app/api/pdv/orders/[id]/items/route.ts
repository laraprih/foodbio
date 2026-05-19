import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPDVSession } from '@/lib/pdv-auth'
import { serverEmit } from '@/lib/server-emit'
import { randomUUID } from 'crypto'

// POST /api/pdv/orders/[id]/items — adiciona itens a um pedido existente
export async function POST(
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

  const { items } = body  // [{ productId, quantity, unitPrice, options, notes }]
  if (!items?.length) {
    return NextResponse.json({ error: 'Itens obrigatórios' }, { status: 400 })
  }

  const pool = getPool()

  // Valida pedido
  const { rows: orderRows } = await pool.query(
    `SELECT id, subtotal, discount, "deliveryFee", status
     FROM "Order"
     WHERE id = $1 AND "tenantId" = $2 AND status NOT IN ('delivered','cancelled')`,
    [id, session.tenantId]
  )
  if (!orderRows.length) {
    return NextResponse.json({ error: 'Pedido não encontrado ou já encerrado' }, { status: 404 })
  }

  let addedSubtotal = 0
  const itemDetails: any[] = []

  for (const item of items) {
    const { rows: pRows } = await pool.query(
      `SELECT id FROM "Product" WHERE id = $1 AND "tenantId" = $2 AND available = true`,
      [item.productId, session.tenantId]
    )
    if (!pRows.length) {
      return NextResponse.json({ error: `Produto indisponível: ${item.productId}` }, { status: 400 })
    }
    const unitPrice  = Number(item.unitPrice)
    const totalPrice = unitPrice * item.quantity
    addedSubtotal += totalPrice
    itemDetails.push({ ...item, unitPrice, totalPrice })
  }

  const order = orderRows[0]
  const newSubtotal = Number(order.subtotal) + addedSubtotal
  const discount    = Number(order.discount)
  const fee         = Number(order.deliveryFee)
  const newTotal    = Math.max(0, newSubtotal - discount + fee)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const item of itemDetails) {
      const itemId = randomUUID()
      await client.query(
        `INSERT INTO "OrderItem" (id, "orderId", "productId", quantity, "unitPrice", "totalPrice", notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [itemId, id, item.productId, item.quantity, item.unitPrice, item.totalPrice, item.notes ?? '']
      )
      for (const opt of (item.options ?? [])) {
        await client.query(
          `INSERT INTO "OrderItemOption" (id, "orderItemId", "optionId", name, price)
           VALUES ($1,$2,$3,$4,$5)`,
          [randomUUID(), itemId, opt.optionId, opt.name, opt.priceModifier ?? 0]
        )
      }
    }

    await client.query(
      `UPDATE "Order" SET subtotal=$1, total=$2, "updatedAt"=NOW() WHERE id=$3`,
      [newSubtotal, newTotal, id]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[pdv/orders/[id]/items]', err)
    return NextResponse.json({ error: 'Erro ao adicionar itens' }, { status: 500 })
  } finally {
    client.release()
  }

  await serverEmit({
    rooms: [`kitchen:${session.tenantId}`, `admin:${session.tenantId}`],
    event: 'new_order',
    data: { orderId: id, itemCount: itemDetails.length, source: 'pdv_edit' },
  })

  return NextResponse.json({ ok: true, newTotal })
}

// DELETE /api/pdv/orders/[id]/items — remove um item do pedido
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getPDVSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { itemId } = await req.json()
  if (!itemId) return NextResponse.json({ error: 'itemId obrigatório' }, { status: 400 })

  const pool = getPool()

  // Busca item para calcular desconto no total
  const { rows: itemRows } = await pool.query(
    `SELECT oi."totalPrice", o.subtotal, o.discount, o."deliveryFee"
     FROM "OrderItem" oi
     JOIN "Order" o ON o.id = oi."orderId"
     WHERE oi.id = $1 AND o.id = $2 AND o."tenantId" = $3
       AND o.status NOT IN ('delivered','cancelled')`,
    [itemId, id, session.tenantId]
  )
  if (!itemRows.length) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })

  const { totalPrice, subtotal, discount, deliveryFee } = itemRows[0]
  const newSubtotal = Math.max(0, Number(subtotal) - Number(totalPrice))
  const newTotal    = Math.max(0, newSubtotal - Number(discount) + Number(deliveryFee))

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DELETE FROM "OrderItem" WHERE id = $1`, [itemId])
    await client.query(
      `UPDATE "Order" SET subtotal=$1, total=$2, "updatedAt"=NOW() WHERE id=$3`,
      [newSubtotal, newTotal, id]
    )
    await client.query('COMMIT')
  } catch {
    await client.query('ROLLBACK')
    return NextResponse.json({ error: 'Erro ao remover item' }, { status: 500 })
  } finally {
    client.release()
  }

  return NextResponse.json({ ok: true, newTotal })
}
