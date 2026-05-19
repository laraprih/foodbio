'use client'

import React from 'react'
import { Plus, Receipt, Clock, RefreshCw, Wallet } from 'lucide-react'
import { formatCurrency, formatOrderTime } from '@/lib/utils'
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/lib/constants'
import type { GarcomTableDetail } from './types'

interface GarcomTableDetailProps {
  detail: GarcomTableDetail | null
  isLoading: boolean
  onAddItems: () => void
  onOpenBill: () => void
  onRefresh: () => void
}

export function GarcomTableDetail({
  detail,
  isLoading,
  onAddItems,
  onOpenBill,
  onRefresh,
}: GarcomTableDetailProps) {
  if (isLoading || !detail) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    )
  }

  const { table, orders, pendingTotal } = detail
  const hasOrders = orders.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Status da mesa */}
      <div className="px-4 pt-4 pb-2">
        <div className={`rounded-2xl p-4 border-2 ${
          hasOrders
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mesa</p>
              <p className="text-3xl font-black text-gray-900">{table.number}</p>
              {table.label && <p className="text-sm text-gray-500">{table.label}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total em aberto</p>
              <p className="text-2xl font-black text-gray-900">
                {formatCurrency(pendingTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {!hasOrders ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Receipt className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">Mesa sem pedidos</p>
            <p className="text-xs mt-1">Adicione itens para começar</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">{formatOrderTime(order.createdAt)}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {ORDER_STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {(order.items ?? []).map(item => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="flex-none text-sm font-bold text-gray-900 w-6 text-center">
                      {item.quantity}×
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{item.name}</p>
                      {item.options?.length ? (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.options.map((o: any) => o.name).join(', ')}
                        </p>
                      ) : null}
                      {item.notes && (
                        <p className="text-xs text-amber-600 mt-0.5 italic">"{item.notes}"</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 flex-none">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ações fixas no rodapé */}
      <div className="p-4 bg-white border-t border-gray-100 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center justify-center w-11 h-11 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onAddItems}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm text-white active:scale-95 transition-all"
            style={{ backgroundColor: 'var(--color-lime-primary, #84cc16)' }}
          >
            <Plus className="w-5 h-5" />
            Adicionar itens
          </button>
        </div>

        {hasOrders && (
          <button
            onClick={onOpenBill}
            className="w-full h-12 rounded-xl font-bold text-sm border-2 border-gray-900 text-gray-900 bg-white flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Wallet className="w-4 h-4" />
            Fechar conta — {formatCurrency(pendingTotal)}
          </button>
        )}
      </div>
    </div>
  )
}
