import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  const user = session?.user as any
  if (!user || user.role !== 'admin' || !user.tenantId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const clientId = process.env.MP_CLIENT_ID
  const redirectUri = process.env.MP_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Mercado Pago não configurado no servidor' }, { status: 500 })
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: user.tenantId,
  })

  return NextResponse.json({ url: `https://auth.mercadopago.com/authorization?${params}` })
}
