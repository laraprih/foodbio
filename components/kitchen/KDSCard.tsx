import React from 'react'
import { Clock, CheckCircle, AlertCircle, UtensilsCrossed, Bike, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getElapsedMinutes } from '@/lib/utils'
import { TIMING } from '@/lib/constants'
import type { Order } from '@/types'

interface KDSCardProps {
  order: Order
  isReadyColumn: boolean
  onAdvance: (id: string) => void
  onServedAtTable: (id: string) => void
  onCancel: (id: string) => void
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

export default function KDSCard({ order, isReadyColumn, onAdvance, onServedAtTable, onCancel }: KDSCardProps) {
  const elapsed   = getElapsedMinutes(order.createdAt)
  const isLate    = elapsed > TIMING.KDS_LATE_MINUTES
  const isInStore = (order as any).type === 'in_store'
  const tableNum  = (order as any).tableNumber
  const waiterName = (order as any).waiterName

  const TypeIcon = TYPE_ICON[(order as any).type ?? 'pickup'] ?? ShoppingBag

  return (
    <div className={cn(
      'bg-white rounded-3xl border-2 flex flex-col overflow-hidden transition-all',
      isLate ? 'border-red-200 shadow-red-100 shadow-lg' : 'border-gray-100 shadow-sm'
    )}>
      {/* Header */}
      <div className={cn('px-4 py-3 flex items-center justify-between', isLate ? 'bg-red-50' : 'bg-gray-50')}>
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-gray-900">#{order.id.slice(-4)}</span>
          <TypeIcon className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-bold text-gray-500">
            {isInStore && tableNum ? `Mesa ${tableNum}` : TYPE_LABEL[(order as any).type ?? 'pickup']}
          </span>
          {isLate && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
        </div>
        <div className="flex items-center gap-1.5 text-gray-500 font-bold text-xs">
          <Clock className="w-3.5 h-3.5" />
          {elapsed} min
        </div>
      </div>

      {/* Garçom responsável — exibido só para pedidos de mesa */}
      {isInStore && waiterName && (
        <div className="px-4 py-1.5 bg-lime-50 border-b border-lime-100 flex items-center gap-1.5">
          <UtensilsCrossed className="w-3 h-3 text-lime-600" />
          <span className="text-xs font-semibold text-lime-700">{waiterName}</span>
        </div>
      )}

      {/* Itens */}
      <div className="flex-1 p-4 space-y-3">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="w-7 h-7 bg-black text-[var(--color-lime-primary)] rounded-lg flex items-center justify-center font-black text-xs shrink-0">
              {item.quantity}
            </span>
            <div>
              <p className="font-bold text-gray-900 leading-tight text-sm">{item.product?.name ?? (item as any).name}</p>
              {item.options?.map((o, oIdx) => (
                <p key={oIdx} className="text-[10px] text-gray-400 font-medium">+ {o.name}</p>
              ))}
              {(item as any).notes && (
                <p className="text-[10px] text-amber-600 italic mt-0.5">"{(item as any).notes}"</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ações */}
      <div className="p-3 bg-gray-50/50 border-t border-gray-100">
        {/* Coluna "Prontos" + pedido de mesa → botão "Servido na Mesa" */}
        {isReadyColumn && isInStore ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onCancel(order.id)}
              className="py-2.5 rounded-xl border border-gray-200 text-gray-400 font-bold text-xs hover:bg-white hover:text-red-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onServedAtTable(order.id)}
              className="py-2.5 rounded-xl bg-lime-500 text-white font-bold text-xs hover:bg-lime-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Servido ✓
            </button>
          </div>
        ) : (
          /* Colunas normais ou pedidos não-mesa */
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onCancel(order.id)}
              className="py-2.5 rounded-xl border border-gray-200 text-gray-400 font-bold text-xs hover:bg-white hover:text-red-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onAdvance(order.id)}
              disabled={isReadyColumn && !isInStore}
              className={cn(
                'py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5',
                isReadyColumn && !isInStore
                  ? 'bg-gray-200 text-gray-400 cursor-default'
                  : 'bg-black text-[var(--color-lime-primary)] hover:opacity-90 active:scale-95'
              )}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {isReadyColumn ? 'Pronto' : 'Avançar →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
