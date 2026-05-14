'use client'

import React from 'react'
import { MapPin, Phone, Clock, Navigation, CheckCircle, Package } from 'lucide-react'
import { cn, formatCurrency, getElapsedMinutes, formatAddress } from '@/lib/utils'
import { TIMING, DeliveryStatus } from '@/lib/constants'
import type { Delivery } from '@/types'

interface DeliveryCardProps {
  delivery: Delivery
  onPickUp?: (id: string) => void
  onDeliver?: (id: string) => void
}

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string }> = {
  [DeliveryStatus.ASSIGNED]: { label: 'Aguardando Coleta', color: 'bg-yellow-100 text-yellow-700' },
  [DeliveryStatus.PICKED_UP]: { label: 'Coletado', color: 'bg-blue-100 text-blue-700' },
  [DeliveryStatus.ON_THE_WAY]: { label: 'A Caminho', color: 'bg-purple-100 text-purple-700' },
  [DeliveryStatus.DELIVERED]: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
}

export default function DeliveryCard({ delivery, onPickUp, onDeliver }: DeliveryCardProps) {
  const { order, status } = delivery
  const config = STATUS_CONFIG[status]
  const elapsed = getElapsedMinutes(delivery.createdAt)
  const isLate = elapsed > TIMING.DELIVERY_LATE_MINUTES

  const addressStr = order.address
    ? formatAddress(order.address)
    : 'Retirada no local'

  const mapsUrl = order.address
    ? `https://maps.google.com/?q=${encodeURIComponent(
        `${order.address.street} ${order.address.number} ${order.address.city}`
      )}`
    : null

  return (
    <div className={cn(
      'bg-white rounded-[28px] border p-6 flex flex-col gap-4 shadow-sm',
      isLate && status !== DeliveryStatus.DELIVERED ? 'border-red-200' : 'border-black/5'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-black text-gray-900">#{order.id.slice(-4)}</span>
          <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', config.color)}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Clock className={cn('w-3.5 h-3.5', isLate && 'text-red-500')} />
          <span className={cn('text-xs font-bold', isLate && 'text-red-500')}>{elapsed}min</span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {order.items.slice(0, 3).map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-5 h-5 bg-zinc-100 rounded-md flex items-center justify-center text-xs font-black text-gray-800">
              {item.quantity}
            </span>
            <span className="font-medium truncate">{item.product.name}</span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-xs text-gray-400 font-medium pl-7">+{order.items.length - 3} itens</p>
        )}
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-2xl px-4 py-3">
        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 leading-snug">{addressStr}</p>
          {order.address?.city && (
            <p className="text-xs text-gray-400 mt-0.5">{order.address.city}</p>
          )}
        </div>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors shrink-0"
          >
            <Navigation className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Customer */}
      {order.customer && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Cliente</p>
            <p className="text-sm font-bold text-gray-800">{order.customer.name}</p>
          </div>
          <a
            href={`tel:${order.customer.phone}`}
            className="w-9 h-9 bg-[var(--color-lime-primary)] rounded-xl flex items-center justify-center text-white hover:brightness-90 transition-all"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400 font-medium">Total do pedido</span>
        <span className="font-black text-gray-900">{formatCurrency(order.total)}</span>
      </div>

      {/* Actions */}
      {status !== DeliveryStatus.DELIVERED && (
        <div className="grid grid-cols-1 gap-3 pt-2 border-t border-gray-100">
          {status === DeliveryStatus.ASSIGNED && onPickUp && (
            <button
              onClick={() => onPickUp(delivery.id)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[var(--color-lime-primary)] text-white font-bold text-sm hover:brightness-90 active:scale-95 transition-all"
            >
              <Package className="w-4 h-4" />
              Confirmar Coleta
            </button>
          )}
          {(status === DeliveryStatus.PICKED_UP || status === DeliveryStatus.ON_THE_WAY) && onDeliver && (
            <button
              onClick={() => onDeliver(delivery.id)}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[var(--color-lime-primary)] text-white font-bold text-sm hover:brightness-90 active:scale-95 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Confirmar Entrega
            </button>
          )}
        </div>
      )}
    </div>
  )
}
