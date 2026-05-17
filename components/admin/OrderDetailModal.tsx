'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  MapPin, Phone, CreditCard, ChevronRight, XCircle,
  RotateCcw, User, Truck, Store, Landmark, Clock,
  CheckCircle2, ChefHat, Package, CheckCircle,
} from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready:     'Pronto',
  dispatched:'A caminho',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  ready:     'bg-orange-100 text-orange-700',
  dispatched:'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

const PAYMENT_LABELS: Record<string, string> = {
  pix:         'PIX',
  credit_card: 'Cartão',
  cash:        'Dinheiro',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending:  'text-amber-600 bg-amber-50',
  approved: 'text-emerald-700 bg-emerald-50',
  rejected: 'text-red-600 bg-red-50',
  refunded: 'text-purple-600 bg-purple-50',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending:  'Aguardando',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  refunded: 'Estornado',
}

// ── tracker steps por tipo de pedido ────────────────────────────────────────

const STEPS_DELIVERY = [
  { id: 'pending',    label: 'Recebido',   Icon: Clock },
  { id: 'confirmed',  label: 'Confirmado', Icon: CheckCircle2 },
  { id: 'preparing',  label: 'Preparo',    Icon: ChefHat },
  { id: 'ready',      label: 'Pronto',     Icon: Package },
  { id: 'dispatched', label: 'A caminho',  Icon: Truck },
  { id: 'delivered',  label: 'Entregue',   Icon: CheckCircle },
]

const STEPS_PICKUP = [
  { id: 'pending',   label: 'Recebido',   Icon: Clock },
  { id: 'confirmed', label: 'Confirmado', Icon: CheckCircle2 },
  { id: 'preparing', label: 'Preparo',    Icon: ChefHat },
  { id: 'ready',     label: 'Pronto',     Icon: Package },
  { id: 'delivered', label: 'Retirado',   Icon: Store },
]

// ── próximos status por tipo ──────────────────────────────────────────────

const NEXT_DELIVERY: Record<string, string> = {
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'dispatched',
  dispatched:'delivered',
}

const NEXT_PICKUP: Record<string, string> = {
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'delivered',
}

const NEXT_LABELS: Record<string, string> = {
  confirmed:  'Confirmar pedido',
  preparing:  'Iniciar preparo',
  ready:      'Marcar como pronto',
  dispatched: 'Saiu pra entrega',
  delivered:  'Pedido entregue',
}

const NEXT_LABELS_PICKUP: Record<string, string> = {
  ...NEXT_LABELS,
  delivered: 'Confirmar retirada',
}

// ── props ─────────────────────────────────────────────────────────────────

interface OrderDetailModalProps {
  order: any | null
  open: boolean
  onClose: () => void
  onAdvance: (id: string, status: string) => void
  onCancel: (id: string) => void
  onRefund: (id: string) => void
  isAdvancing?: boolean
  isCancelling?: boolean
  isRefunding?: boolean
}

export default function OrderDetailModal({
  order, open, onClose,
  onAdvance, onCancel, onRefund,
  isAdvancing, isCancelling, isRefunding,
}: OrderDetailModalProps) {
  if (!order) return null

  const isDelivery = order.type === 'delivery'
  const trackerSteps = isDelivery ? STEPS_DELIVERY : STEPS_PICKUP
  const nextStatusMap = isDelivery ? NEXT_DELIVERY : NEXT_PICKUP
  const nextLabels    = isDelivery ? NEXT_LABELS   : NEXT_LABELS_PICKUP

  const addr = order.address
    ? typeof order.address === 'string'
      ? (() => { try { return JSON.parse(order.address) } catch { return null } })()
      : order.address
    : order.deliveryAddress
      ? typeof order.deliveryAddress === 'string'
        ? (() => { try { return JSON.parse(order.deliveryAddress) } catch { return null } })()
        : order.deliveryAddress
      : null

  const nextStatus = nextStatusMap[order.status]
  const canAdvance = !!nextStatus
  const canCancel  = order.status !== 'cancelled' && order.status !== 'delivered'
  const canRefund  = order.paymentStatus === 'approved' && order.paymentMethod !== 'cash'

  const createdAt = new Date(order.createdAt)
  const timeStr = createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  const activeIdx = trackerSteps.findIndex((s) => s.id === order.status)

  return (
    <Modal open={open} onClose={onClose} size="2xl">
      <div className="flex flex-col gap-3">

        {/* ── Header ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-gray-900 text-base tracking-tight">
            #{order.id.slice(-8).toUpperCase()}
          </span>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600')}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          <span className={cn(
            'flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full',
            isDelivery ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
          )}>
            {isDelivery
              ? <><Truck className="w-3 h-3" />Delivery</>
              : <><Store className="w-3 h-3" />Retirada</>}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
            <Clock className="w-3 h-3" />{dateStr} às {timeStr}
          </span>
        </div>

        {/* ── Tracker — steps dinâmicos por tipo ── */}
        <div className="bg-gray-50 rounded-xl px-3 py-2.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center min-w-max">
            {trackerSteps.map((step, idx) => {
              const done   = idx < activeIdx
              const active = idx === activeIdx
              const { Icon } = step
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all',
                      done   ? 'bg-[var(--color-lime-primary)] border-[var(--color-lime-primary)]' :
                      active ? 'bg-[var(--color-lime-primary)] border-[var(--color-lime-primary)] ring-2 ring-[var(--color-lime-primary)]/25' :
                               'bg-white border-gray-200'
                    )}>
                      {done
                        ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                        : <Icon className={cn('w-3 h-3', active ? 'text-white' : 'text-gray-300')} />}
                    </div>
                    <span className={cn(
                      'text-[9px] font-bold text-center leading-none w-12',
                      done || active ? 'text-gray-700' : 'text-gray-300'
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {idx < trackerSteps.length - 1 && (
                    <div className={cn(
                      'h-0.5 w-8 shrink-0 mx-0.5 mb-3 transition-colors',
                      done ? 'bg-[var(--color-lime-primary)]' : 'bg-gray-200'
                    )} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* ── Info grid: cliente + endereço/balcão + pagamento ── */}
        <div className="grid grid-cols-3 gap-2">
          {/* Cliente */}
          <div className="bg-gray-50 rounded-xl p-2.5 space-y-1.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Cliente</p>
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-xs font-bold text-gray-900 truncate">{order.customerName || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 truncate">{order.customerPhone || '—'}</span>
            </div>
          </div>

          {/* Endereço — só delivery mostra endereço, pickup mostra balcão */}
          <div className="bg-gray-50 rounded-xl p-2.5 space-y-1.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              {isDelivery ? 'Endereço' : 'Local de retirada'}
            </p>
            <div className="flex items-start gap-1.5">
              {isDelivery
                ? <MapPin className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                : <Store className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />}
              {isDelivery && addr ? (
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-tight">{addr.street}, {addr.number}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">{addr.neighborhood}</p>
                  {addr.city && <p className="text-[10px] text-gray-400">{addr.city}/{addr.state}</p>}
                </div>
              ) : (
                <span className="text-xs font-semibold text-orange-600">Balcão / Loja</span>
              )}
            </div>
          </div>

          {/* Pagamento */}
          <div className="bg-gray-50 rounded-xl p-2.5 space-y-1.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Pagamento</p>
            <div className="flex items-center gap-1.5">
              {order.paymentMethod === 'pix'
                ? <Landmark className="w-3 h-3 text-emerald-500 shrink-0" />
                : <CreditCard className="w-3 h-3 text-blue-500 shrink-0" />}
              <span className="text-xs font-bold text-gray-900">
                {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </span>
            </div>
            <span className={cn(
              'inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              PAYMENT_STATUS_COLORS[order.paymentStatus] ?? 'bg-gray-100 text-gray-600'
            )}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
            </span>
          </div>
        </div>

        {/* ── Itens ── */}
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Itens ({order.items?.length ?? 0})
          </p>
          <div className="space-y-1.5">
            {(order.items ?? []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-[var(--color-lime-primary)]/10 text-[var(--color-lime-primary)] text-[10px] font-black flex items-center justify-center shrink-0">
                    {item.quantity}
                  </span>
                  <span className="text-xs font-semibold text-gray-800 truncate">
                    {item.product?.name ?? '—'}
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-700 shrink-0">
                  {formatCurrency((item.price ?? 0) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-2.5 pt-2 space-y-1">
            {(order.deliveryFee ?? 0) > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900 text-sm">
              <span>Total</span>
              <span>{formatCurrency(order.total ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* ── Ações ── */}
        <div className="flex flex-col gap-2 pt-1">
          {canAdvance && (
            <button
              onClick={() => { onAdvance(order.id, nextStatus); onClose() }}
              disabled={isAdvancing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-lime-primary)] text-white font-bold text-sm hover:brightness-90 transition-all disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
              {nextLabels[nextStatus] ?? `Avançar para ${nextStatus}`}
            </button>
          )}

          {(canRefund || canCancel) && (
            <div className={cn('grid gap-2', canRefund && canCancel ? 'grid-cols-2' : 'grid-cols-1')}>
              {canRefund && (
                <button
                  onClick={() => { onRefund(order.id); onClose() }}
                  disabled={isRefunding}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-purple-200 text-purple-700 font-bold text-xs hover:bg-purple-50 transition-all disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Estornar
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => { onCancel(order.id); onClose() }}
                  disabled={isCancelling}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancelar pedido
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </Modal>
  )
}
