'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import OrderTracker from '@/components/ecommerce/OrderTracker'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  MapPin, Phone, CreditCard, ChevronRight, XCircle,
  RotateCcw, User, Truck, Store, Landmark, Clock,
} from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  cash: 'Dinheiro',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-600 bg-amber-50',
  approved: 'text-emerald-700 bg-emerald-50',
  rejected: 'text-red-600 bg-red-50',
  refunded: 'text-purple-600 bg-purple-50',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  refunded: 'Estornado',
}

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
}

const NEXT_STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmar pedido',
  preparing: 'Iniciar preparo',
  ready: 'Marcar como pronto',
  delivered: 'Marcar como entregue',
}

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

  const addr = order.address
    ? typeof order.address === 'string'
      ? (() => { try { return JSON.parse(order.address) } catch { return null } })()
      : order.address
    : null

  const nextStatus = NEXT_STATUS[order.status]
  const canAdvance = !!nextStatus
  const canCancel = order.status !== 'cancelled' && order.status !== 'delivered'
  const canRefund = order.paymentStatus === 'approved' && order.paymentMethod !== 'cash'

  const createdAt = new Date(order.createdAt)
  const timeStr = createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  return (
    <Modal open={open} onClose={onClose} size="2xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 mb-5 -mt-1 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-black text-gray-900 text-lg tracking-tight">
            #{order.id.slice(-8).toUpperCase()}
          </span>
          <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600')}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
          <span className={cn(
            'flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full',
            order.type === 'delivery' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
          )}>
            {order.type === 'delivery'
              ? <><Truck className="w-3 h-3" /> Delivery</>
              : <><Store className="w-3 h-3" /> Retirada</>}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
          <Clock className="w-3 h-3" />{dateStr} às {timeStr}
        </span>
      </div>

      {/* ── Tracker horizontal ── */}
      <div className="bg-gray-50 rounded-2xl px-4 py-5 mb-5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Progresso do pedido</p>
        <OrderTracker status={order.status} horizontal />
      </div>

      {/* ── Duas colunas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

        {/* Coluna esquerda: cliente + entrega + pagamento */}
        <div className="space-y-4">
          {/* Cliente */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cliente</p>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-white rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                <User className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <span className="text-sm font-bold text-gray-900">{order.customerName || '—'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-white rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <span className="text-sm font-semibold text-gray-700">{order.customerPhone || '—'}</span>
            </div>
          </div>

          {/* Entrega */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Entrega</p>
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 bg-white rounded-xl flex items-center justify-center shrink-0 border border-gray-100 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div>
                {addr ? (
                  <>
                    <p className="text-sm font-bold text-gray-900">{addr.street}, {addr.number}</p>
                    <p className="text-xs text-gray-500">{addr.neighborhood} — {addr.city}/{addr.state}</p>
                    {addr.complement && <p className="text-xs text-gray-400">{addr.complement}</p>}
                    {addr.cep && <p className="text-xs text-gray-400">CEP {addr.cep}</p>}
                  </>
                ) : (
                  <p className="text-sm font-semibold text-gray-700">Retirada no balcão</p>
                )}
              </div>
            </div>
          </div>

          {/* Pagamento */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pagamento</p>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-white rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                {order.paymentMethod === 'pix'
                  ? <Landmark className="w-3.5 h-3.5 text-emerald-500" />
                  : <CreditCard className="w-3.5 h-3.5 text-blue-500" />}
              </div>
              <span className="text-sm font-bold text-gray-900">
                {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </span>
              <span className={cn(
                'ml-auto text-xs font-bold px-2 py-0.5 rounded-full',
                PAYMENT_STATUS_COLORS[order.paymentStatus] ?? 'bg-gray-100 text-gray-600'
              )}>
                {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Coluna direita: itens + totais */}
        <div className="bg-gray-50 rounded-2xl p-4 flex flex-col">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            Itens ({order.items?.length ?? 0})
          </p>
          <div className="space-y-2.5 flex-1">
            {(order.items ?? []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-[var(--color-lime-primary)]/10 text-[var(--color-lime-primary)] text-xs font-black flex items-center justify-center shrink-0">
                    {item.quantity}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {item.product?.name ?? '—'}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-700 shrink-0">
                  {formatCurrency((item.price ?? 0) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="border-t border-gray-200 mt-4 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal ?? 0)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Taxa de entrega</span>
              <span>{formatCurrency(order.deliveryFee ?? 0)}</span>
            </div>
            <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(order.total ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ações ── */}
      <div className="flex flex-col gap-2">
        {canAdvance && (
          <button
            onClick={() => { onAdvance(order.id, nextStatus); onClose() }}
            disabled={isAdvancing}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[var(--color-lime-primary)] text-white font-bold text-sm hover:brightness-90 transition-all disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
            {NEXT_STATUS_LABELS[nextStatus] ?? `Avançar para ${nextStatus}`}
          </button>
        )}
        <div className={cn('grid gap-2', canRefund && canCancel ? 'grid-cols-2' : 'grid-cols-1')}>
          {canRefund && (
            <button
              onClick={() => { onRefund(order.id); onClose() }}
              disabled={isRefunding}
              className="flex items-center justify-center gap-1.5 py-3 rounded-2xl border-2 border-purple-200 text-purple-700 font-bold text-sm hover:bg-purple-50 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Estornar pagamento
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => { onCancel(order.id); onClose() }}
              disabled={isCancelling}
              className="flex items-center justify-center gap-1.5 py-3 rounded-2xl border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancelar pedido
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
