'use client'

import React, { useState } from 'react'
import { X, Plus, Banknote, QrCode, CreditCard, SplitSquareVertical } from 'lucide-react'
import type { PaymentLine, PaymentMethod } from './types'

const METHODS: { key: PaymentMethod; label: string; Icon: React.ElementType }[] = [
  { key: 'cash',        label: 'Dinheiro',  Icon: Banknote },
  { key: 'pix',         label: 'PIX',       Icon: QrCode },
  { key: 'credit_card', label: 'Crédito',   Icon: CreditCard },
  { key: 'debit_card',  label: 'Débito',    Icon: CreditCard },
]

interface Props {
  total: number
  loading: boolean
  onConfirm: (payments: PaymentLine[]) => void
  onCancel: () => void
}

export function PDVCheckout({ total, loading, onConfirm, onCancel }: Props) {
  const [payments, setPayments] = useState<PaymentLine[]>([
    { method: 'cash', amount: total, received: total },
  ])
  const [multiMode, setMultiMode] = useState(false)

  const paidTotal = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, total - paidTotal)
  const change = payments
    .filter(p => p.method === 'cash')
    .reduce((s, p) => s + ((p.received ?? p.amount) - p.amount), 0)

  function updatePayment(index: number, field: keyof PaymentLine, value: unknown) {
    setPayments(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function addPayment() {
    setPayments(prev => [...prev, { method: 'pix', amount: remaining }])
    setMultiMode(true)
  }

  function removePayment(index: number) {
    setPayments(prev => prev.filter((_, i) => i !== index))
  }

  function handleSingleMethod(method: PaymentMethod) {
    setPayments([{ method, amount: total, received: method === 'cash' ? total : undefined }])
    setMultiMode(false)
  }

  const isValid = paidTotal >= total - 0.01

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-gray-900">Cobrar</h2>
            <p className="text-2xl font-black mt-0.5" style={{ color: 'var(--color-lime-primary)' }}>
              R$ {total.toFixed(2)}
            </p>
          </div>
          <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
          {/* Single payment mode — method picker */}
          {!multiMode && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Forma de pagamento</p>
              <div className="grid grid-cols-2 gap-2">
                {METHODS.map(({ key, label, Icon }) => {
                  const active = payments[0]?.method === key
                  return (
                    <button
                      key={key}
                      onClick={() => handleSingleMethod(key)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                        active
                          ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)]/10 text-gray-900'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cash received + change */}
          {payments.some(p => p.method === 'cash') && (
            <div className="space-y-3">
              {payments.filter(p => p.method === 'cash').map((p, i) => {
                const realIndex = payments.indexOf(p)
                const cashChange = (p.received ?? p.amount) - p.amount
                return (
                  <div key={i} className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Valor recebido
                    </p>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={p.received ?? ''}
                      onChange={e => updatePayment(realIndex, 'received', parseFloat(e.target.value) || 0)}
                      placeholder={p.amount.toFixed(2)}
                      className="w-full bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 text-xl font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                    />
                    {cashChange > 0 && (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <span className="text-sm font-bold text-green-700">Troco</span>
                        <span className="text-xl font-black text-green-700">R$ {cashChange.toFixed(2)}</span>
                      </div>
                    )}
                    {cashChange < 0 && (
                      <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <span className="text-sm font-bold text-red-600">Valor insuficiente</span>
                        <span className="text-base font-black text-red-600">Faltam R$ {Math.abs(cashChange).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Multi-payment lines */}
          {multiMode && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Divisão de pagamento</p>
              {payments.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={p.method}
                    onChange={e => updatePayment(i, 'method', e.target.value)}
                    className="flex-1 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 focus:outline-none"
                  >
                    {METHODS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                  <input
                    type="number"
                    value={p.amount}
                    onChange={e => updatePayment(i, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-28 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                  />
                  {payments.length > 1 && (
                    <button onClick={() => removePayment(i)} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {remaining > 0.01 && (
                <button onClick={addPayment} className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar forma de pagamento (R$ {remaining.toFixed(2)} restantes)
                </button>
              )}
            </div>
          )}

          {/* Split payment toggle */}
          {!multiMode && (
            <button
              onClick={() => { setMultiMode(true); addPayment() }}
              className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
            >
              <SplitSquareVertical className="w-4 h-4" />
              Dividir pagamento entre formas
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 space-y-3">
          {multiMode && (
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-500">Pago</span>
              <span className={paidTotal >= total ? 'text-green-600' : 'text-red-500'}>
                R$ {paidTotal.toFixed(2)} / R$ {total.toFixed(2)}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              className="py-3.5 rounded-xl font-bold text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={() => onConfirm(payments)}
              disabled={!isValid || loading}
              className="py-3.5 rounded-xl font-black text-sm text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-lime-primary)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {change > 0 ? `Troco R$ ${change.toFixed(2)}` : 'Confirmar venda'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
