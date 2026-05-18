'use client'

import React, { useState } from 'react'
import {
  ShoppingCart, X, Plus, Minus, Percent,
  DollarSign, Store, Truck, TableProperties,
  Pencil, Check, ChevronDown,
} from 'lucide-react'
import type { CartItem, Discount, OrderType, PDVTable } from './types'

interface Props {
  cart: CartItem[]
  onUpdateQty: (cartId: string, qty: number) => void
  onRemove: (cartId: string) => void
  onUpdateNotes: (cartId: string, notes: string) => void
  onClear: () => void
  orderType: OrderType
  onSetOrderType: (t: OrderType) => void
  selectedTableId: string | null
  onSetTable: (id: string | null) => void
  tables: PDVTable[]
  customerName: string
  onSetCustomerName: (v: string) => void
  customerPhone: string
  onSetCustomerPhone: (v: string) => void
  discount: Discount | null
  onSetDiscount: (d: Discount | null) => void
  deliveryFee: number
  subtotal: number
  total: number
  onCheckout: () => void
  cashSessionOpen: boolean
}

export function PDVComanda({
  cart, onUpdateQty, onRemove, onUpdateNotes, onClear,
  orderType, onSetOrderType, selectedTableId, onSetTable, tables,
  customerName, onSetCustomerName, customerPhone, onSetCustomerPhone,
  discount, onSetDiscount, deliveryFee, subtotal, total, onCheckout, cashSessionOpen,
}: Props) {
  const [editNoteId, setEditNoteId] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState('')
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountType, setDiscountType] = useState<'value' | 'pct'>('value')
  const [discountInput, setDiscountInput] = useState('')
  const [showTables, setShowTables] = useState(false)

  const discountAmount = discount
    ? discount.type === 'value'
      ? Math.min(discount.amount, subtotal)
      : subtotal * (discount.amount / 100)
    : 0

  function applyDiscount() {
    const num = parseFloat(discountInput.replace(',', '.'))
    if (!num || num <= 0) { setShowDiscount(false); return }
    if (discountType === 'pct' && num > 100) return
    onSetDiscount({ type: discountType, amount: num })
    setShowDiscount(false)
    setDiscountInput('')
  }

  function startNoteEdit(item: CartItem) {
    setEditNoteId(item.cartId)
    setNoteValue(item.notes)
  }

  return (
    <aside className="w-80 xl:w-96 bg-white border-l border-gray-100 flex flex-col shrink-0 shadow-lg">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShoppingCart className="w-5 h-5 text-gray-700" />
          <span className="font-black text-gray-900 text-base">Comanda</span>
        </div>
        {cart.length > 0 && (
          <span className="text-xs font-black bg-gray-900 text-white px-2.5 py-0.5 rounded-full">
            {cart.reduce((s, i) => s + i.quantity, 0)} itens
          </span>
        )}
      </div>

      {/* Order type */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { type: 'pickup',   Icon: Store,           label: 'Balcão' },
            { type: 'in_store', Icon: TableProperties, label: 'Mesa' },
            { type: 'delivery', Icon: Truck,           label: 'Delivery' },
          ] as const).map(({ type, Icon, label }) => (
            <button
              key={type}
              onClick={() => { onSetOrderType(type); if (type !== 'in_store') onSetTable(null) }}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                orderType === type
                  ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)]/10 text-gray-900'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Table selector */}
        {orderType === 'in_store' && (
          <div className="mt-2 relative">
            <button
              onClick={() => setShowTables(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
            >
              <span>
                {selectedTableId
                  ? `Mesa ${tables.find(t => t.id === selectedTableId)?.number ?? '?'}`
                  : 'Selecionar mesa'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showTables && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-40 overflow-y-auto no-scrollbar">
                {tables.filter(t => t.status === 'free' || t.id === selectedTableId).map(t => (
                  <button
                    key={t.id}
                    onClick={() => { onSetTable(t.id); setShowTables(false) }}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 font-semibold flex items-center justify-between"
                  >
                    <span>Mesa {t.number}{t.label ? ` — ${t.label}` : ''}</span>
                    <span className="text-xs text-green-500">Livre</span>
                  </button>
                ))}
                {tables.filter(t => t.status === 'free' || t.id === selectedTableId).length === 0 && (
                  <p className="px-3 py-2 text-xs text-gray-400">Nenhuma mesa livre</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer */}
      <div className="px-5 py-3 border-b border-gray-100 space-y-2">
        <input
          type="text"
          placeholder="Nome do cliente (opcional)"
          value={customerName}
          onChange={e => onSetCustomerName(e.target.value)}
          className="w-full bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
        />
        <input
          type="tel"
          placeholder="Telefone (opcional)"
          value={customerPhone}
          onChange={e => onSetCustomerPhone(e.target.value)}
          className="w-full bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
        />
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-300">
            <ShoppingCart className="w-10 h-10 mb-2" />
            <p className="text-xs font-semibold">Comanda vazia</p>
          </div>
        ) : cart.map(item => (
          <div key={item.cartId} className="bg-gray-50 rounded-xl p-3 group">
            <div className="flex items-start gap-2">
              {/* Qty stepper */}
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                <button
                  onClick={() => onUpdateQty(item.cartId, item.quantity - 1)}
                  className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center text-sm font-black">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQty(item.cartId, item.quantity + 1)}
                  className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-200 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 leading-tight truncate">{item.name}</p>
                {item.options.map(o => (
                  <p key={o.optionId} className="text-[10px] text-gray-400 leading-tight">
                    {o.name}{o.priceModifier !== 0 ? ` (+R$ ${o.priceModifier.toFixed(2)})` : ''}
                  </p>
                ))}
                {item.notes && (
                  <p className="text-[10px] text-amber-600 italic mt-0.5">"{item.notes}"</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <p className="text-xs font-black text-gray-900">
                  R$ {(item.unitPrice * item.quantity).toFixed(2)}
                </p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startNoteEdit(item)}
                    className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-blue-50 transition-colors"
                  >
                    <Pencil className="w-2.5 h-2.5 text-gray-500" />
                  </button>
                  <button
                    onClick={() => onRemove(item.cartId)}
                    className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <X className="w-2.5 h-2.5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Inline note editor */}
            {editNoteId === item.cartId && (
              <div className="mt-2 flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={noteValue}
                  onChange={e => setNoteValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { onUpdateNotes(item.cartId, noteValue); setEditNoteId(null) } }}
                  placeholder="Observação..."
                  className="flex-1 bg-white rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-lime-primary)]"
                />
                <button
                  onClick={() => { onUpdateNotes(item.cartId, noteValue); setEditNoteId(null) }}
                  className="w-6 h-6 rounded-lg bg-green-500 text-white flex items-center justify-center"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Discount section */}
      {cart.length > 0 && (
        <div className="px-5 pb-2 border-t border-gray-100 pt-3">
          {showDiscount ? (
            <div className="flex gap-2">
              <div className="flex rounded-xl border border-gray-200 overflow-hidden shrink-0">
                <button
                  onClick={() => setDiscountType('value')}
                  className={`px-2 py-1.5 text-xs font-bold transition-colors ${discountType === 'value' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  R$
                </button>
                <button
                  onClick={() => setDiscountType('pct')}
                  className={`px-2 py-1.5 text-xs font-bold transition-colors ${discountType === 'pct' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  %
                </button>
              </div>
              <input
                autoFocus
                type="number"
                value={discountInput}
                onChange={e => setDiscountInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyDiscount()}
                placeholder={discountType === 'value' ? '0,00' : '0'}
                className="flex-1 bg-gray-50 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
              />
              <button onClick={applyDiscount} className="px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-bold">
                OK
              </button>
              <button onClick={() => { setShowDiscount(false); onSetDiscount(null) }} className="px-2 py-1.5 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDiscount(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              {discount ? (
                <>
                  <Percent className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-600">
                    Desconto: {discount.type === 'pct' ? `${discount.amount}%` : `R$ ${discount.amount.toFixed(2)}`}
                  </span>
                  <span className="text-green-600">(-R$ {discountAmount.toFixed(2)})</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-3.5 h-3.5" />
                  Aplicar desconto
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Totals + actions */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-1.5 shrink-0">
        <div className="flex justify-between text-xs text-gray-500 font-semibold">
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-xs text-green-600 font-bold">
            <span>Desconto</span>
            <span>-R$ {discountAmount.toFixed(2)}</span>
          </div>
        )}
        {deliveryFee > 0 && orderType === 'delivery' && (
          <div className="flex justify-between text-xs text-gray-500 font-semibold">
            <span>Taxa de entrega</span>
            <span>R$ {deliveryFee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1 border-t border-gray-200">
          <span className="text-xs font-black text-gray-900 uppercase tracking-wide">Total</span>
          <span className="text-2xl font-black text-gray-900">R$ {total.toFixed(2)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onClear}
            disabled={cart.length === 0}
            className="py-3 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Limpar
          </button>
          <button
            onClick={onCheckout}
            disabled={cart.length === 0 || !cashSessionOpen}
            className="py-3 rounded-xl text-sm font-black text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{ backgroundColor: 'var(--color-lime-primary)' }}
          >
            {cashSessionOpen ? 'Cobrar →' : 'Caixa fechado'}
          </button>
        </div>
      </div>
    </aside>
  )
}
