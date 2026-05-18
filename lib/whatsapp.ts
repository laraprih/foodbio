const GRAPH_API = 'https://graph.facebook.com/v21.0'

function cfg() {
  const token   = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) return null
  return { token, phoneId }
}

/** Normaliza para E.164 sem '+': ex. "5511999999999" */
export function normalizeWhatsAppPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d
  if (d.length === 11 || d.length === 10) return `55${d}`
  return d
}

async function postMessage(phoneId: string, token: string, payload: object): Promise<boolean> {
  try {
    const res = await fetch(`${GRAPH_API}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[whatsapp] send failed (${res.status}):`, body)
      return false
    }
    return true
  } catch (e) {
    console.error('[whatsapp] send error:', e)
    return false
  }
}

export async function sendWhatsAppText(to: string, text: string): Promise<boolean> {
  const c = cfg()
  if (!c) { console.warn('[whatsapp] WHATSAPP_TOKEN ou WHATSAPP_PHONE_ID não configurados'); return false }
  return postMessage(c.phoneId, c.token, {
    messaging_product: 'whatsapp',
    to: normalizeWhatsAppPhone(to),
    type: 'text',
    text: { body: text, preview_url: false },
  })
}

export async function sendWhatsAppTemplate(
  to: string,
  name: string,
  languageCode: string,
  components: object[]
): Promise<boolean> {
  const c = cfg()
  if (!c) return false
  return postMessage(c.phoneId, c.token, {
    messaging_product: 'whatsapp',
    to: normalizeWhatsAppPhone(to),
    type: 'template',
    template: { name, language: { code: languageCode }, components },
  })
}

export async function sendVerificationCode(to: string, code: string): Promise<boolean> {
  const tpl = process.env.WHATSAPP_VERIFY_TEMPLATE
  if (tpl) {
    return sendWhatsAppTemplate(to, tpl, 'pt_BR', [
      { type: 'body', parameters: [{ type: 'text', text: code }] },
    ])
  }
  // Fallback: mensagem de texto (funciona dentro da janela de 24h ou em sandbox)
  return sendWhatsAppText(
    to,
    `🔐 *Código de verificação*\n\nSeu código é: *${code}*\n\nVálido por 10 minutos. Não compartilhe com ninguém.`
  )
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

  const tpl = process.env.WHATSAPP_ORDER_TEMPLATE
  if (tpl) {
    return sendWhatsAppTemplate(phone, tpl, 'pt_BR', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: name },
          { type: 'text', text: orderCode },
          { type: 'text', text: tenantName },
          { type: 'text', text: link },
        ],
      },
    ])
  }

  return sendWhatsAppText(
    phone,
    `✅ *Pedido confirmado!*\n\nOlá, ${name}! Seu pagamento foi aprovado.\n\n🆔 Pedido: *#${orderCode}*\n🍽️ *${tenantName}*\n\n📍 Acompanhe em tempo real:\n${link}`
  )
}
