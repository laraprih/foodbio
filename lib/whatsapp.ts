/**
 * Serviço de envio de WhatsApp via número próprio da empresa.
 *
 * Suporta dois provedores (configure via WHATSAPP_PROVIDER):
 *   "zapi"      → Z-API SaaS (z-api.io) — plano pago, sem servidor
 *   "evolution" → Evolution API self-hosted no VPS — gratuito
 *
 * O provedor é detectado automaticamente pelas variáveis presentes:
 *   Z-API:     ZAPI_INSTANCE_ID + ZAPI_INSTANCE_TOKEN + ZAPI_CLIENT_TOKEN
 *   Evolution: EVOLUTION_URL + EVOLUTION_INSTANCE + EVOLUTION_API_KEY
 */

/** Normaliza qualquer formato de telefone para E.164 sem '+': 5585996975158 */
export function normalizeWhatsAppPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  // Já tem código do Brasil (55) e tamanho correto
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d
  // Número brasileiro sem DDI: DDD (2) + número (8 ou 9) = 10 ou 11 dígitos
  if (d.length === 10 || d.length === 11) return `55${d}`
  return d
}

// ─── Z-API ───────────────────────────────────────────────────────────────────
// Docs: https://developer.z-api.io/en/message/send-message-text
// Credenciais: instanceId, instanceToken (na URL) + clientToken (header)

async function sendViaZapi(phone: string, message: string): Promise<boolean> {
  const instanceId    = process.env.ZAPI_INSTANCE_ID
  const instanceToken = process.env.ZAPI_INSTANCE_TOKEN
  const clientToken   = process.env.ZAPI_CLIENT_TOKEN

  if (!instanceId || !instanceToken || !clientToken) {
    console.warn('[whatsapp/zapi] variáveis ZAPI_INSTANCE_ID / ZAPI_INSTANCE_TOKEN / ZAPI_CLIENT_TOKEN não configuradas')
    return false
  }

  const url = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken,
      },
      body: JSON.stringify({ phone: normalizeWhatsAppPhone(phone), message }),
      signal: AbortSignal.timeout(12_000),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[whatsapp/zapi] erro ${res.status}:`, body)
      return false
    }
    return true
  } catch (e) {
    console.error('[whatsapp/zapi] falha na requisição:', e)
    return false
  }
}

// ─── Evolution API ───────────────────────────────────────────────────────────
// Docs: https://doc.evolution-api.com/v2/api-reference/message-controller/send-text
// Instalar no VPS: docker run -d -p 8080:8080 -e AUTHENTICATION_API_KEY=... atendai/evolution-api:latest

async function sendViaEvolution(phone: string, message: string): Promise<boolean> {
  const baseUrl      = (process.env.EVOLUTION_URL ?? '').replace(/\/$/, '')
  const instanceName = process.env.EVOLUTION_INSTANCE
  const apiKey       = process.env.EVOLUTION_API_KEY

  if (!baseUrl || !instanceName || !apiKey) {
    console.warn('[whatsapp/evolution] variáveis EVOLUTION_URL / EVOLUTION_INSTANCE / EVOLUTION_API_KEY não configuradas')
    return false
  }

  const url = `${baseUrl}/message/sendText/${instanceName}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: normalizeWhatsAppPhone(phone),
        text: message,
      }),
      signal: AbortSignal.timeout(12_000),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[whatsapp/evolution] erro ${res.status}:`, body)
      return false
    }
    return true
  } catch (e) {
    console.error('[whatsapp/evolution] falha na requisição:', e)
    return false
  }
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

function detectProvider(): 'zapi' | 'evolution' | null {
  const explicit = process.env.WHATSAPP_PROVIDER
  if (explicit === 'zapi' || explicit === 'evolution') return explicit

  // Auto-detecta pelo que está configurado
  if (process.env.ZAPI_INSTANCE_ID)    return 'zapi'
  if (process.env.EVOLUTION_URL)       return 'evolution'

  return null
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const provider = detectProvider()

  if (!provider) {
    console.warn('[whatsapp] nenhum provedor configurado. Configure ZAPI_* ou EVOLUTION_*')
    return false
  }

  if (provider === 'zapi')      return sendViaZapi(phone, message)
  if (provider === 'evolution') return sendViaEvolution(phone, message)
  return false
}

// ─── Mensagens prontas ────────────────────────────────────────────────────────

export async function sendVerificationCode(phone: string, code: string): Promise<boolean> {
  const message =
    `🔐 *Código de verificação*\n\n` +
    `Seu código é: *${code}*\n\n` +
    `Válido por 10 minutos. Não compartilhe este código.`

  return sendWhatsAppMessage(phone, message)
}

export async function sendOrderConfirmation(opts: {
  phone: string
  customerName: string
  orderId: string
  orderCode: string
  slug: string
  tenantName: string
}): Promise<boolean> {
  const { phone, customerName, orderId, orderCode, slug, tenantName } = opts
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  const link   = `${appUrl}/${slug}/pedido/${orderId}`
  const name   = customerName?.trim() || 'Cliente'

  const message =
    `✅ *Pedido confirmado!*\n\n` +
    `Olá, ${name}! Seu pagamento foi aprovado.\n\n` +
    `🆔 Pedido: *#${orderCode}*\n` +
    `🍽️ *${tenantName}*\n\n` +
    `📍 *Acompanhe em tempo real:*\n${link}`

  return sendWhatsAppMessage(phone, message)
}
