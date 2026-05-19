// ── Order & delivery status enums ─────────────────────────────────────────────
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum DeliveryStatus {
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  ON_THE_WAY = 'on_the_way',
  DELIVERED = 'delivered',
}

// ── Timing thresholds (minutes) ───────────────────────────────────────────────
export const TIMING = {
  KDS_LATE_MINUTES: 20,
  DELIVERY_LATE_MINUTES: 30,
} as const

// ── Polling intervals (ms) ────────────────────────────────────────────────────
export const POLL = {
  KDS: 15_000,
  ORDERS: 15_000,
  DELIVERY: 20_000,
  DASHBOARD: 10_000,
  REPORTS_SUMMARY: 5 * 60_000,
} as const

// ── Commission defaults ────────────────────────────────────────────────────────
export const DEFAULT_COMMISSION_PERCENT = 8

// ── Valid order status transitions ────────────────────────────────────────────
export const ORDER_NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
  [OrderStatus.CONFIRMED]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.READY,
  [OrderStatus.READY]: OrderStatus.DELIVERED,
}

// ── Order status display maps ─────────────────────────────────────────────────
export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending:    'Pendente',
  confirmed:  'Confirmado',
  preparing:  'Preparando',
  ready:      'Pronto',
  dispatched: 'A caminho',
  delivered:  'Entregue',
  cancelled:  'Cancelado',
}

export const ORDER_STATUS_COLOR: Record<string, string> = {
  pending:    'bg-gray-100 text-gray-600',
  confirmed:  'bg-blue-100 text-blue-700',
  preparing:  'bg-yellow-100 text-yellow-700',
  ready:      'bg-orange-100 text-orange-700',
  dispatched: 'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
}

// ── Payment display maps ──────────────────────────────────────────────────────
export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pix:         'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card:  'Cartão de Débito',
  cash:        'Dinheiro',
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending:    'Aguardando',
  approved:   'Aprovado',
  failed:     'Falhou',
  refunded:   'Estornado',
  chargeback: 'Contestado',
}

export const PAYMENT_STATUS_COLOR: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  approved:   'bg-green-100 text-green-700',
  failed:     'bg-red-100 text-red-600',
  refunded:   'bg-gray-100 text-gray-600',
  chargeback: 'bg-orange-100 text-orange-700',
}

// ── Order type display map ────────────────────────────────────────────────────
export const ORDER_TYPE_LABEL: Record<string, string> = {
  delivery: '🛵 Delivery',
  pickup:   '🏪 Retirada',
  in_store: '🪑 Mesa',
}

// ── Staff role display map ────────────────────────────────────────────────────
export const STAFF_ROLE_LABEL: Record<string, string> = {
  attendant: 'Operador PDV',
  cook:      'Cozinheiro',
  driver:    'Entregador',
  waiter:    'Garçom',
  manager:   'Gerente',
  host:      'Maître/Recepcionista',
  bartender: 'Barman',
}

export const STAFF_ROLE_SECTION: Record<string, string | null> = {
  attendant: 'pdv',
  cook:      'cozinha',
  driver:    'entregas',
  waiter:    'garcom',
  manager:   null,
  host:      null,
  bartender: null,
}

// ── Garcom polling interval ───────────────────────────────────────────────────
export const GARCOM_POLL_MS = 15_000

// ── Table status display map ──────────────────────────────────────────────────
export const TABLE_STATUS_LABEL: Record<string, string> = {
  free:            'Livre',
  occupied:        'Ocupada',
  waiting_payment: 'Aguardando pagamento',
}

export const TABLE_STATUS_COLOR: Record<string, string> = {
  free:            'bg-gray-100 text-gray-500 border-gray-200',
  occupied:        'bg-emerald-50 text-emerald-700 border-emerald-300',
  waiting_payment: 'bg-amber-50 text-amber-700 border-amber-400',
}
