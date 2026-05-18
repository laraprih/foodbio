import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { sendVerificationCode, normalizeWhatsAppPhone } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const raw: string = body?.phone ?? ''

  if (!raw) return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 })

  const phone = normalizeWhatsAppPhone(raw)
  if (phone.length < 12 || phone.length > 13) {
    return NextResponse.json(
      { error: 'Número inválido. Use DDD + número (ex: 11999999999)' },
      { status: 400 }
    )
  }

  const pool = getPool()

  // Rate limit: no máximo 3 envios por número em 10 minutos
  const { rows: recent } = await pool.query(
    `SELECT COUNT(*) AS cnt FROM "WhatsAppVerification"
     WHERE phone = $1 AND created_at > NOW() - INTERVAL '10 minutes'`,
    [phone]
  )
  if (parseInt(recent[0]?.cnt ?? '0') >= 3) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde 10 minutos e tente novamente.' },
      { status: 429 }
    )
  }

  const code      = String(Math.floor(1000 + Math.random() * 9000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

  // Upsert: se já existir, substitui o código (inclusive se já estava verificado — permite re-verificar)
  await pool.query(
    `INSERT INTO "WhatsAppVerification" (phone, code, verified, attempts, expires_at, created_at)
     VALUES ($1, $2, false, 0, $3, NOW())
     ON CONFLICT (phone) DO UPDATE SET
       code       = EXCLUDED.code,
       verified   = false,
       attempts   = 0,
       expires_at = EXCLUDED.expires_at,
       created_at = NOW()`,
    [phone, code, expiresAt]
  )

  const sent = await sendVerificationCode(phone, code)

  if (!sent) {
    // Em dev, expõe o código para facilitar testes
    if (process.env.NODE_ENV === 'development') {
      console.info(`[whatsapp/dev] código para ${phone}: ${code}`)
      return NextResponse.json({ ok: true, devCode: code })
    }
    return NextResponse.json(
      { error: 'Falha ao enviar mensagem. Verifique se o número está correto.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true })
}
