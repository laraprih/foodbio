import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getWaiterSession } from '@/lib/waiter-auth'
import { serverEmit } from '@/lib/server-emit'

export const dynamic = 'force-dynamic'

// POST /api/garcom/checkout — confirma pagamento de todos os pedidos pendentes da mesa
// Atualiza paymentStatus, libera mesa e emite socket para todo o sistema
export async function POST(req: NextRequest) {
  const session = await getWaiterSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { tableId, paymentMethod } = body

  const VALID_METHODS = ['pix', 'credit_card', 'debit_card', 'cash']
  if (!tableId || !VALID_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const pool = getPool()

  // Validar que a mesa pertence ao tenant
  const { rows: tableRows } = await pool.query(
    `SELECT id, number FROM "Table" WHERE id = $1 AND "tenantId" = $2 AND active = true`,
    [tableId, session.tenantId]
  )
  if (!tableRows.length) {
    return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Baixa todos os pedidos pendentes da mesa de uma vez
    const { rows: updatedOrders } = await client.query(
      `UPDATE "Order"
       SET "paymentStatus" = 'approved',
           "paymentMethod" = $1,
           "status" = 'delivered',
           "updatedAt" = NOW()
       WHERE "tableId" = $2
         AND "tenantId" = $3
         AND status NOT IN ('delivered', 'cancelled')
         AND "paymentStatus" = 'pending'
       RETURNING id, total`,
      [paymentMethod, tableId, session.tenantId]
    )

    const ordersUpdated = updatedOrders.length
    const totalPaid = updatedOrders.reduce((acc: number, o: any) => acc + Number(o.total), 0)

    // Libera a mesa
    await client.query(
      `UPDATE "Table" SET status = 'free' WHERE id = $1`,
      [tableId]
    )

    await client.query('COMMIT')

    // Emite para todo o sistema em tempo real
    await serverEmit({
      rooms: [
        `kitchen:${session.tenantId}`,
        `admin:${session.tenantId}`,
        `pdv:${session.tenantId}`,
      ],
      event: 'table_paid',
      data: {
        tableId,
        tableNumber: tableRows[0].number,
        paymentMethod,
        ordersUpdated,
        totalPaid,
        waiterName: session.name,
      },
    })

    return NextResponse.json({ ok: true, ordersUpdated, totalPaid })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[garcom/checkout]', err)
    return NextResponse.json({ error: 'Erro ao processar pagamento' }, { status: 500 })
  } finally {
    client.release()
  }
}
