'use client'

import React from 'react'
import { X, Minus, Plus, Trash2, ChefHat } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { CartItem } from './types'

interface GarcomOrderSummaryProps {
  cart: CartItem[]
  tableNumber: number
  onUpdateQty: (cartId: string, qty: number) => void
  onRemoveItem: (cartId: string) => void
  onSend: () => void
  onBack: () => void
  isSending: boolean
}

export function GarcomOrderSummary({
  cart,
  tableNumber,
  onUpdateQty,
  onRemoveItem,
  onSend,
  onBack,
  isSending,
}: GarcomOrderSummaryProps) {
  const total = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center h-14 px-4 gap-3 border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-1 rounded-full hover:bg-gray-100">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <span className="font-bold text-gray-900 flex-1">
          Pedido — Mesa {tableNumber}
        </span>
        <span className="text-sm text-gray-500">
          {cart.reduce((a, i) => a + i.quantity, 0)} itens
        </span>
      </header>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ChefHat className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">Nenhum item adicionado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 px-4">
            {cart.map(item => (
              <div key={item.cartId} className="py-4 flex items-start gap-3">
                {/* Qty stepper */}
                <div className="flex items-center gap-2 flex-none pt-0.5">
                  <button
                    onClick={() => onUpdateQty(item.cartId, item.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center active:scale-90 transition-all"
                  >
                    {item.quantity === 1
                      ? <Trash2 className="w-3 h-3 text-red-400" />
                      : <Minus className="w-3 h-3 text-gray-500" />
                    }
                  </button>
                  <span className="text-sm font-bold w-5 text-center text-gray-900">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQty(item.cartId, item.quantity + 1)}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center active:scale-90 transition-all"
                  >
                    <Plus className="w-3 h-3 text-gray-500" />
                  </button>
                </div>

                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  {item.options.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.options.map(o => o.name).join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-amber-600 mt-0.5 italic">"{item.notes}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatCurrency(item.unitPrice)} un.
                  </p>
                </div>

                {/* Subtotal */}
                <div className="flex-none text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                  <button
                    onClick={() => onRemoveItem(item.cartId)}
                    className="mt-1 text-xs text-red-400 hover:text-red-600"
                  >
                    remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-3 bg-white">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-gray-900">Total desta rodada</span>
          <span className="text-xl font-black text-gray-900">{formatCurrency(total)}</span>
        </div>

        <button
          onClick={onSend}
          disabled={cart.length === 0 || isSending}
          className="w-full h-13 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 py-3.5 disabled:opacity-40 active:scale-98 transition-all"
          style={{ backgroundColor: 'var(--color-lime-primary, #84cc16)' }}
        >
          <ChefHat className="w-5 h-5" />
          {isSending ? 'Enviando...' : 'Enviar para a cozinha'}
        </button>
      </div>
    </div>
  )
}
