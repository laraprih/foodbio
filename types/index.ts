import type { z } from 'zod'
import type { checkoutSchema } from '@/lib/validations'
import type { OrderStatus, DeliveryStatus } from '@/lib/constants'

// ── Shared address ────────────────────────────────────────────────────────────
export interface Address {
  street: string
  number: string
  neighborhood: string
  city: string
}

// ── Order domain ──────────────────────────────────────────────────────────────
export interface OrderOption {
  optionId: string
  name: string
  price: number
}

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  product: { name: string }
  options?: OrderOption[]
}

export interface Order {
  id: string
  status: OrderStatus
  paymentStatus: string
  paymentMethod: 'pix' | 'credit_card'
  type: 'delivery' | 'pickup'
  total: number
  subtotal: number
  deliveryFee: number
  customerName: string
  customerPhone: string
  tenantId: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  address?: Address
  externalReference?: string
}

// ── Delivery domain ───────────────────────────────────────────────────────────
export interface DeliveryOrder {
  id: string
  total: number
  items: { quantity: number; product: { name: string } }[]
  customer?: { name: string; phone: string }
  address?: Address
}

export interface Delivery {
  id: string
  status: DeliveryStatus
  estimatedMinutes?: number
  createdAt: string
  order: DeliveryOrder
}

// ── Payment / tokenisation ────────────────────────────────────────────────────
export interface CardData {
  cardNumber: string
  cardholderName: string
  cardExpirationMonth: string
  cardExpirationYear: string
  securityCode: string
  identificationType?: string
  identificationNumber?: string
}

// ── Admin metrics ─────────────────────────────────────────────────────────────
export interface Metrics {
  totalRevenue: number
  orderCount: number
  averageTicket?: number
  newCustomers?: number
}

// ── Menu ──────────────────────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  position: number
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  available: boolean
  imageUrl?: string | null
  category: Category
}

// ── Tenant / session ──────────────────────────────────────────────────────────
export interface TenantInfo {
  id: string
  slug: string
  name: string
  gateway: 'mercadopago' | 'pagbank' | null
}

// ── Checkout form data (derived from Zod schema) ──────────────────────────────
export type CheckoutData = z.infer<typeof checkoutSchema>

// ── Payment transaction ───────────────────────────────────────────────────────
export interface PaymentTransaction {
  id: string
  orderId: string
  tenantId: string
  gateway: string
  gatewayTransactionId?: string
  totalAmount: number
  marketplaceFee: number
  sellerAmount: number
  splitStatus: 'pending' | 'done' | 'refunded' | 'chargeback' | 'failed'
  processedAt?: string
}
