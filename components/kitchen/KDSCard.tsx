import React from 'react'
import {
  Clock, CheckCircle2, XCircle, AlertTriangle,
  UtensilsCrossed, Bike, ShoppingBag, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getElapsedMinutes } from '@/lib/utils'
import { TIMING } from '@/lib/constants'
import type { Order } from '@/types'

interface KDSCardProps {
  order: Order
  column: 'confirmed' | 'preparing' | 'ready'
  onAdvance: (id: string) => void
  onServedAtTable: (id: string) => void
  onCancel: (id: string) => void
  isPending?: boolean
}

const TYPE_ICON: Record<string, React.ElementType> = {
  in_store: UtensilsCrossed,
  delivery: Bike,
  pickup:   ShoppingBag,
}

const TYPE_LABEL: Record<string, string> = {
  in_store: 'Mesa',
  delivery: 'Delivery',
  pickup:   'Retirada',
}

// Cor da borda esquerda + accent por coluna
const COL_ACCENT: Record<string, { border: string; badge: string; badgeText: string }> = {
  confirmed: { border: 'border-l-blue-500',    badge: 'bg-blue-500',    badgeText: 'NOVO' },
  preparing: { border: 'border-l-amber-400',   badge: 'bg-amber-400',   badgeText: 'PREPARO' },
  ready:     { border: 'border-l-emerald-400', badge: 'bg-emerald-400', badgeText: 'PRONTO' },
}

function timerColor(elapsed: number, isLate: boolean) {
  if (isLate)     return 'text-red-400'
  if (elapsed > 10) return 'text-amber-400'
  return 'text-emerald-400'
}

export default function KDSCard({
  order, column, onAdvance, onServedAtTable, onCancel, isPending,
}: KDSCardProps) {
  const elapsed    = getElapsedMinutes(order.createdAt)
  const isLate     = elapsed > TIMING.KDS_LATE_MINUTES
  const isInStore  = (order as any).type === 'in_store' || !!(order as any).tableId
  const tableNum   = (order as any).tableNumber
  const waiterName = (order as any).waiterName
  const orderType  = isInStore ? 'in_store' : ((order as any).type ?? 'pickup')
  const TypeIcon   = TYPE_ICON[orderType] ?? ShoppingBag
  const accent     = COL_ACCENT[column] ?? COL_ACCENT.confirmed
  const isReady    = column === 'ready'

  return (
    <div className={cn(
      'rounded-2xl border-l-4 bg-zinc-800 overflow-hidden flex flex-col',
      'shadow-lg transition-all duration-200',
      accent.border,
      isLate && 'ring-2 ring-red-500/60 animate-pulse-border',
    )}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80">
        <div className="flex items-center gap-2 min-w-0">
          {/* Status badge */}
          <span className={cn(
            'text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest shrink-0',
            accent.badge, 'text-white'
          )}>
            {accent.badgeText}
          </span>

          {/* Type + table */}
          <div className="flex items-center gap-1.5 min-w-0">
            <TypeIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-sm font-black text-white truncate">
              {isInStore && tableNum ? `Mesa ${tableNum}` : TYPE_LABEL[orderType]}
            </span>
            {(order as any).customerName && !isInStore && (
              <span className="text-xs text-zinc-500 truncate hidden sm:block">
                · {(order as any).customerName}
              </span>
            )}
          </div>
        </div>

        {/* Timer */}
        <div className={cn(
          'flex items-center gap-1.5 shrink-0 font-black text-sm',
          timerColor(elapsed, isLate)
        )}>
          {isLate && <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />}
          <Clock className="w-3.5 h-3.5" />
          <span>{elapsed}min</span>
        </div>
      </div>

      {/* Garçom */}
      {isInStore && waiterName && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-lime-900/40 border-b border-lime-700/30">
          <UtensilsCrossed className="w-3 h-3 text-lime-400 shrink-0" />
          <span className="text-xs font-semibold text-lime-300 truncate">{waiterName}</span>
        </div>
      )}

      {/* ── Itens ──────────────────────────────────────────────── */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            {/* Qty badge */}
            <span className="shrink-0 min-w-[32px] h-8 rounded-lg flex items-center justify-center font-black text-sm bg-zinc-700 text-white">
              {item.quantity}×
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="font-bold text-white text-sm leading-snug">
                {item.product?.name ?? (item as any).name}
              </p>
              {item.options?.map((o, i) => (
                <p key={i} className="text-xs text-zinc-400 mt-0.5">
                  + {o.name}
                </p>
              ))}
              {(item as any).notes && (
                <p className="text-xs text-amber-400 italic mt-1 flex items-start gap-1">
                  <span className="shrink-0">⚠</span>
                  <span>"{(item as any).notes}"</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Ações ──────────────────────────────────────────────── */}
      <div className="px-3 pb-3 pt-2 space-y-2">
        {isReady ? (
          isInStore ? (
            /* Mesa pronta: Servido na Mesa */
            <button
              onClick={() => onServedAtTable(order.id)}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50 font-black text-sm text-white"
            >
              <CheckCircle2 className="w-4 h-4" />
              Servido na Mesa
            </button>
          ) : (
            /* Pickup/Delivery prontos */
            <div className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Aguardando retirada
            </div>
          )
        ) : (
          /* Colunas Novos e Em Preparo: botão de avanço */
          <button
            onClick={() => onAdvance(order.id)}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl font-black text-sm active:scale-95 transition-all disabled:opacity-50 bg-white text-zinc-900 hover:bg-zinc-100"
          >
            {column === 'confirmed' ? 'Iniciar Preparo' : 'Marcar Pronto'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Cancelar — só nas colunas Novos e Em Preparo */}
        {!isReady && (
          <button
            onClick={() => onCancel(order.id)}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold text-zinc-500 hover:text-red-400 hover:bg-zinc-700 active:scale-95 transition-all disabled:opacity-50 border border-zinc-700"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancelar pedido
          </button>
        )}
      </div>
    </div>
  )
}
