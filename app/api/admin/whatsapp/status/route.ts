import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/session'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/admin/whatsapp/status
// Retorna status de conexão + QR code (se desconectado) para o provedor configurado
export async function GET(req: NextRequest) {
  const session = await auth()
  const tenantId = requireAdmin(session)
  if (!tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const provider = detectProvider()
  if (!provider) {
    return NextResponse.json({
      provider: null,
      connected: false,
      error: 'Nenhum provedor de WhatsApp configurado. Configure EVOLUTION_* ou ZAPI_* no servidor.',
    })
  }

  try {
    if (provider === 'evolution') return NextResponse.json(await getEvolutionStatus())
    if (provider === 'zapi')      return NextResponse.json(await getZapiStatus())
  } catch (err: any) {
    console.error('[whatsapp/status]', err)
    return NextResponse.json({ provider, connected: false, error: err.message })
  }

  return NextResponse.json({ provider, connected: false })
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function detectProvider(): 'evolution' | 'zapi' | null {
  const explicit = process.env.WHATSAPP_PROVIDER
  if (explicit === 'evolution') return 'evolution'
  if (explicit === 'zapi')      return 'zapi'
  if (process.env.EVOLUTION_URL)    return 'evolution'
  if (process.env.ZAPI_INSTANCE_ID) return 'zapi'
  return null
}

// ── Evolution API ───────────────────────────────────────────────────────────────

async function getEvolutionStatus() {
  const base     = (process.env.EVOLUTION_URL ?? '').replace(/\/$/, '')
  const instance = process.env.EVOLUTION_INSTANCE ?? ''
  const apiKey   = process.env.EVOLUTION_API_KEY ?? ''

  const headers = { apikey: apiKey, 'Content-Type': 'application/json' }

  // 1. Verifica estado da conexão
  const stateRes = await fetch(`${base}/instance/connectionState/${instance}`, {
    headers,
    signal: AbortSignal.timeout(8_000),
  })
  const stateBody = await stateRes.json()
  const state: string = stateBody?.instance?.state ?? stateBody?.state ?? 'close'
  const connected = state === 'open'

  if (connected) {
    return { provider: 'evolution', connected: true, qrCode: null, state }
  }

  // 2. Se desconectado, solicita QR code
  const qrRes = await fetch(`${base}/instance/connect/${instance}`, {
    headers,
    signal: AbortSignal.timeout(10_000),
  })
  const qrBody = await qrRes.json()

  // Evolution retorna base64 como string pura ou como data URL
  const qrCode: string | null =
    qrBody?.base64 ?? qrBody?.qrcode?.base64 ?? qrBody?.code ?? null

  return {
    provider: 'evolution',
    connected: false,
    state,
    qrCode: qrCode
      ? (qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`)
      : null,
  }
}

// ── Z-API ────────────────────────────────────────────────────────────────────────

async function getZapiStatus() {
  const id      = process.env.ZAPI_INSTANCE_ID    ?? ''
  const token   = process.env.ZAPI_INSTANCE_TOKEN ?? ''
  const cToken  = process.env.ZAPI_CLIENT_TOKEN   ?? ''
  const headers = { 'Client-Token': cToken }
  const base    = `https://api.z-api.io/instances/${id}/token/${token}`

  // 1. Verifica conexão
  const statusRes = await fetch(`${base}/status`, {
    headers,
    signal: AbortSignal.timeout(8_000),
  })
  const statusBody = await statusRes.json()
  const connected: boolean = statusBody?.connected ?? false

  if (connected) {
    return { provider: 'zapi', connected: true, qrCode: null }
  }

  // 2. Busca QR code
  const qrRes  = await fetch(`${base}/qr-code/image?imageType=base64`, {
    headers,
    signal: AbortSignal.timeout(10_000),
  })
  const qrBody = await qrRes.json()
  const raw: string | null = qrBody?.value ?? null

  return {
    provider: 'zapi',
    connected: false,
    qrCode: raw ? `data:image/png;base64,${raw}` : null,
  }
}
