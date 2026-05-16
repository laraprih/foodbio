import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

async function getCustomerUser(session: any) {
  const user = session?.user as any
  if (!user || user.role !== 'customer') return null
  return user
}

// GET — perfil, endereços e pedidos
export async function GET() {
  const session = await auth()
  const u = await getCustomerUser(session)
  if (!u) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pool = getPool()

  const { rows: userRows } = await pool.query(
    `SELECT id, name, email, phone, "avatarUrl", "createdAt" FROM "User" WHERE id = $1`,
    [u.id]
  )
  if (!userRows.length) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  const user = userRows[0]

  // Busca ou cria Customer (addresses + orders)
  let { rows: custRows } = await pool.query(
    `SELECT id, addresses FROM "Customer" WHERE "userId" = $1`,
    [u.id]
  )
  if (!custRows.length) {
    const newId = randomUUID()
    await pool.query(
      `INSERT INTO "Customer" (id, "userId", addresses) VALUES ($1, $2, '[]'::jsonb)
       ON CONFLICT ("userId") DO NOTHING`,
      [newId, u.id]
    )
    const refetch = await pool.query(
      `SELECT id, addresses FROM "Customer" WHERE "userId" = $1`,
      [u.id]
    )
    custRows = refetch.rows
  }
  const customer = custRows[0]
  const addresses = customer?.addresses ?? []

  // Pedidos do cliente
  let orders: any[] = []
  if (customer?.id) {
    const { rows: orderRows } = await pool.query(
      `SELECT o.id, o.status, o.type, o.total, o."paymentMethod", o."paymentStatus",
              o."createdAt", o."updatedAt"
       FROM "Order" o
       WHERE o."customerId" = $1
       ORDER BY o."createdAt" DESC
       LIMIT 50`,
      [customer.id]
    )

    const orderIds = orderRows.map((o: any) => o.id)
    let itemsByOrder: Record<string, any[]> = {}
    if (orderIds.length) {
      const { rows: itemRows } = await pool.query(
        `SELECT oi."orderId", oi.quantity, p.name AS product_name
         FROM "OrderItem" oi
         JOIN "Product" p ON p.id = oi."productId"
         WHERE oi."orderId" = ANY($1)`,
        [orderIds]
      )
      for (const item of itemRows) {
        if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = []
        itemsByOrder[item.orderId].push({ quantity: item.quantity, name: item.product_name })
      }
    }

    orders = orderRows.map((o: any) => ({
      id: o.id,
      status: o.status,
      type: o.type,
      total: o.total,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      items: itemsByOrder[o.id] ?? [],
    }))
  }

  return NextResponse.json({ user, addresses, orders })
}

// PATCH — atualizar nome e telefone
export async function PATCH(req: NextRequest) {
  const session = await auth()
  const u = await getCustomerUser(session)
  if (!u) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const name  = (body.name  ?? '').trim()
  const phone = (body.phone ?? '').trim()

  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const pool = getPool()
  await pool.query(
    `UPDATE "User" SET name = $1, phone = $2 WHERE id = $3`,
    [name, phone || null, u.id]
  )

  return NextResponse.json({ ok: true })
}
