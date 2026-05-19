import { createDecipheriv } from 'crypto'

// Espelho da função decryptToken do Fastify (api/src/services/tenant.service.ts)
// Usa a mesma ENCRYPTION_KEY e algoritmo AES-256-GCM
function getKey(): Buffer {
  return Buffer.from(process.env.ENCRYPTION_KEY ?? '0'.repeat(64), 'hex')
}

export function decryptMPToken(ciphertext: string): string {
  try {
    const buf  = Buffer.from(ciphertext, 'base64')
    const iv   = buf.subarray(0, 12)
    const tag  = buf.subarray(12, 28)
    const data = buf.subarray(28)
    const decipher = createDecipheriv('aes-256-gcm', getKey(), iv)
    decipher.setAuthTag(tag)
    return decipher.update(data).toString('utf8') + decipher.final('utf8')
  } catch {
    // Se falhar (token em texto puro no ambiente local), retorna como está
    return ciphertext
  }
}

// URL de webhook correta — sempre aponta para o domínio de produção
export function mpWebhookUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  // Garante que não usa o placeholder de desenvolvimento
  if (!base || base.includes('seudominio')) return 'https://www.foodbio.app'
  return base.replace(/\/$/, '')
}
