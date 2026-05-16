import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST — adicionar endereço
export async function POST(req: NextRequest) {
  const session = await auth()
  const u = (session?.user as any)
  if (!u || u.role !== 'customer') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { street, number, complement, neighborhood, city, state, cep } = body
  if (!street || !number || !neighborhood || !city || !state) {
    return NextResponse.json({ error: 'Dados de endereço incompletos' }, { status: 400 })
  }

  const pool = getPool()

  // Garante que Customer existe
  const { rows } = await pool.query(
    `SELECT id, addresses FROM "Customer" WHERE "userId" = $1`,
    [u.id]
  )

  const newAddr = { street, number, complement: complement || '', neighborhood, city, state, cep: cep || '', label: `${street}, ${number}` }

  if (!rows.length) {
    await pool.query(
      `INSERT INTO "Customer" (id, "userId", addresses) VALUES (gen_random_uuid(), $1, $2::jsonb)`,
      [u.id, JSON.stringify([newAddr])]
    )
  } else {
    const current = rows[0].addresses ?? []
    const updated = [...current, newAddr]
    await pool.query(
      `UPDATE "Customer" SET addresses = $1::jsonb WHERE "userId" = $2`,
      [JSON.stringify(updated), u.id]
    )
  }

  return NextResponse.json({ ok: true })
}

// DELETE — remover endereço pelo índice
export async function DELETE(req: NextRequest) {
  const session = await auth()
  const u = (session?.user as any)
  if (!u || u.role !== 'customer') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { index } = await req.json()
  if (typeof index !== 'number') return NextResponse.json({ error: 'Índice inválido' }, { status: 400 })

  const pool = getPool()
  const { rows } = await pool.query(
    `SELECT addresses FROM "Customer" WHERE "userId" = $1`,
    [u.id]
  )
  if (!rows.length) return NextResponse.json({ ok: true })

  const current: any[] = rows[0].addresses ?? []
  const updated = current.filter((_: any, i: number) => i !== index)
  await pool.query(
    `UPDATE "Customer" SET addresses = $1::jsonb WHERE "userId" = $2`,
    [JSON.stringify(updated), u.id]
  )

  return NextResponse.json({ ok: true })
}
