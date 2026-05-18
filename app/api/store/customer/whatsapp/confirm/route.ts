import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { normalizeWhatsAppPhone } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

// POST — confirma o código de 4 dígitos
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const rawPhone: string = body?.phone ?? ''
  const code: string     = String(body?.code ?? '').trim()

  if (!rawPhone || !code) {
    return NextResponse.json({ error: 'Telefone e código são obrigatórios' }, { status: 400 })
  }

  const phone = normalizeWhatsAppPhone(rawPhone)
  const pool  = getPool()

  const { rows } = await pool.query(
    `SELECT id, code, verified, attempts, expires_at
     FROM "WhatsAppVerification"
     WHERE phone = $1`,
    [phone]
  )

  if (!rows.length) {
    return NextResponse.json(
      { error: 'Nenhum código foi enviado para este número. Clique em "Enviar código".' },
      { status: 400 }
    )
  }

  const rec = rows[0]

  if (rec.verified) {
    return NextResponse.json({ ok: true, alreadyVerified: true })
  }

  if (new Date(rec.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'Código expirado. Solicite um novo código.' },
      { status: 400 }
    )
  }

  if (rec.attempts >= 5) {
    return NextResponse.json(
      { error: 'Muitas tentativas incorretas. Solicite um novo código.' },
      { status: 400 }
    )
  }

  if (rec.code !== code) {
    await pool.query(
      `UPDATE "WhatsAppVerification" SET attempts = attempts + 1 WHERE id = $1`,
      [rec.id]
    )
    const remaining = Math.max(0, 4 - rec.attempts)
    return NextResponse.json(
      { error: `Código incorreto. ${remaining} tentativa(s) restante(s).` },
      { status: 400 }
    )
  }

  // Código correto — marca como verificado
  await pool.query(
    `UPDATE "WhatsAppVerification" SET verified = true WHERE id = $1`,
    [rec.id]
  )

  // Se o usuário está logado, persiste o número verificado no perfil
  try {
    const session = await auth()
    const user = session?.user as any
    if (user?.id) {
      await pool.query(
        `UPDATE "User" SET phone = COALESCE(NULLIF(phone, ''), $1) WHERE id = $2`,
        [phone, user.id]
      )
    }
  } catch {}

  return NextResponse.json({ ok: true })
}

// GET — verifica se um número já está confirmado
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('phone') ?? ''
  if (!raw) return NextResponse.json({ verified: false })

  const phone = normalizeWhatsAppPhone(raw)
  const pool  = getPool()

  const { rows } = await pool.query(
    `SELECT verified FROM "WhatsAppVerification" WHERE phone = $1`,
    [phone]
  )

  return NextResponse.json({ verified: rows[0]?.verified === true, phone })
}
