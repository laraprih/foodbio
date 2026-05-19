export type GarcomView = 'tables' | 'table-detail' | 'catalog' | 'cart'

export interface GarcomTable {
  id: string
  number: number
  capacity: number
  label: string | null
  status: 'free' | 'occupied' | 'waiting_payment'
  open_orders: number
  pending_total: number
}

export interface GarcomOrderItem {
  id: string
  productId: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes: string | null
  options: { name: string; price: number }[] | null
}

export interface GarcomOrder {
  id: string
  status: string
  paymentStatus: string
  total: number
  subtotal: number
  discount: number
  customerName: string | null
  createdAt: string
  items: GarcomOrderItem[]
}

export interface GarcomTableDetail {
  table: GarcomTable
  orders: GarcomOrder[]
  pendingTotal: number
}

// Menu
export interface GarcomOption {
  id: string
  groupId: string
  name: string
  priceModifier: number
  available: boolean
}

export interface GarcomOptionGroup {
  id: string
  productId: string
  name: string
  required: boolean
  maxChoices: number
  minChoices: number
  options: GarcomOption[]
}

export interface GarcomProduct {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  available: boolean
  optionGroups: GarcomOptionGroup[]
}

export interface GarcomCategory {
  id: string
  name: string
  order: number
  products: GarcomProduct[]
}

// Cart
export interface SelectedOption {
  optionId: string
  groupId: string
  name: string
  priceModifier: number
}

export interface CartItem {
  cartId: string
  productId: string
  name: string
  basePrice: number
  unitPrice: number
  quantity: number
  notes: string
  options: SelectedOption[]
}
