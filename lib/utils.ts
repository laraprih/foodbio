import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatOrderTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function getElapsedMinutes(dateString: string): number {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 60_000)
}

export function formatAddress(address: {
  street: string
  number: string
  neighborhood: string
  city?: string
}): string {
  return `${address.street}, ${address.number} — ${address.neighborhood}`
}

export interface DeliveryAddress {
  street:       string
  number:       string
  complement?:  string
  neighborhood: string
  city?:        string
  state?:       string
  cep?:         string
}

export function parseDeliveryAddress(raw: unknown): DeliveryAddress | null {
  if (!raw) return null
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const p = parsed as Record<string, unknown>
    if (!p.street && !p.neighborhood) return null
    return {
      street:       String(p.street       ?? ''),
      number:       String(p.number       ?? ''),
      complement:   p.complement ? String(p.complement) : undefined,
      neighborhood: String(p.neighborhood ?? ''),
      city:         p.city  ? String(p.city)  : undefined,
      state:        p.state ? String(p.state) : undefined,
      cep:          p.cep   ? String(p.cep)   : undefined,
    }
  } catch {
    return null
  }
}
