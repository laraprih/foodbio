export type PDVModule = 'catalog' | 'tables' | 'orders' | 'cash' | 'summary'

export type OrderType = 'pickup' | 'delivery' | 'in_store'

export type PaymentMethod = 'cash' | 'pix' | 'credit_card' | 'debit_card'

export interface SelectedOption {
  optionId: string
  groupId: string
  name: string
  priceModifier: number
}

export interface CartItem {
  cartId: string        // unique per line (UUID)
  productId: string
  name: string
  unitPrice: number     // base price + options
  basePrice: number
  quantity: number
  notes: string
  options: SelectedOption[]
}

export interface Discount {
  type: 'value' | 'pct'
  amount: number        // R$ or %
}

export interface PaymentLine {
  method: PaymentMethod
  amount: number
  received?: number     // only for cash — used to calc change
}

export interface PDVOption {
  id: string
  name: string
  priceModifier: number
  available: boolean
}

export interface PDVOptionGroup {
  id: string
  productId: string
  name: string
  required: boolean
  maxChoices: number
  minChoices: number
  options: PDVOption[]
}

export interface PDVProduct {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  available: boolean
  optionGroups: PDVOptionGroup[]
}

export interface PDVMenuCategory {
  id: string
  name: string
  order: number
  products: PDVProduct[]
}

export interface PDVTable {
  id: string
  number: number
  capacity: number
  label: string | null
  status: 'free' | 'occupied' | 'waiting_payment'
}

export interface CashSession {
  id: string
  tenantId: string
  operatorId: string
  operatorName: string
  openedAt: string
  closedAt: string | null
  initialAmount: number
  closeAmount: number | null
  status: 'open' | 'closed'
}

export interface CashMovement {
  id: string
  sessionId: string
  type: 'bleed' | 'supply'
  amount: number
  reason: string
  createdAt: string
}

export interface PDVOrder {
  id: string
  type: string
  status: string
  total: number
  subtotal: number
  discount: number
  deliveryFee: number
  paymentMethod: string | null
  customerName: string | null
  customerPhone: string | null
  tableNumber: number | null
  createdAt: string
  items: PDVOrderItem[]
}

export interface PDVOrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes: string | null
}

export interface ShiftSummary {
  session: CashSession
  orders: number
  cancelled: number
  byMethod: Record<string, number>
  grossTotal: number
  discounts: number
  netTotal: number
  bleeds: number
  supplies: number
  expectedCash: number
  movements: CashMovement[]
}
