// Gerador de payload PIX BRCode (EMVCo / ISO 20022) — formato estático
// https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf

function emv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`
}

function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function sanitize(str: string, max: number): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .slice(0, max)
}

export interface PixParams {
  key: string         // chave PIX (telefone, CPF, CNPJ, email ou chave aleatória)
  name: string        // nome do recebedor (max 25 chars)
  city: string        // cidade do recebedor (max 15 chars)
  amount: number      // valor em reais
  txid?: string       // identificador da transação (max 25 chars)
}

export function buildPixPayload({ key, name, city, amount, txid = '***' }: PixParams): string {
  const merchantInfo =
    emv('00', 'br.gov.bcb.pix') +
    emv('01', key)

  const additionalData = emv('05', txid.slice(0, 25))

  const body =
    emv('00', '01') +
    emv('26', merchantInfo) +
    emv('52', '0000') +
    emv('53', '986') +
    emv('54', amount.toFixed(2)) +
    emv('58', 'BR') +
    emv('59', sanitize(name, 25)) +
    emv('60', sanitize(city, 15)) +
    emv('62', additionalData) +
    '6304'

  return body + crc16(body)
}

export function pixQrCodeUrl(payload: string, size = 280): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=M&data=${encodeURIComponent(payload)}`
}
