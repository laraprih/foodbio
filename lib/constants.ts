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
