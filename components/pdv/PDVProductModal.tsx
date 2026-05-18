'use client'

import React, { useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import type { PDVProduct, CartItem, SelectedOption } from './types'

interface Props {
  product: PDVProduct
  onAdd: (item: CartItem) => void
  onClose: () => void
}

export function PDVProductModal({ product, onAdd, onClose }: Props) {
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [selected, setSelected] = useState<Record<string, SelectedOption[]>>({})

  function toggleOption(group: PDVProduct['optionGroups'][number], opt: PDVProduct['optionGroups'][number]['options'][number]) {
    setSelected(prev => {
      const current = prev[group.id] ?? []
      const exists = current.find(o => o.optionId === opt.id)

      if (exists) {
        return { ...prev, [group.id]: current.filter(o => o.optionId !== opt.id) }
      }

      if (group.maxChoices === 1) {
        return {
          ...prev,
          [group.id]: [{ optionId: opt.id, groupId: group.id, name: opt.name, priceModifier: opt.priceModifier }],
        }
      }

      if (current.length >= group.maxChoices) return prev

      return {
        ...prev,
        [group.id]: [...current, { optionId: opt.id, groupId: group.id, name: opt.name, priceModifier: opt.priceModifier }],
      }
    })
  }

  function isValid() {
    for (const group of product.optionGroups) {
      if (group.required && (selected[group.id]?.length ?? 0) < group.minChoices) return false
    }
    return true
  }

  const allSelected = Object.values(selected).flat()
  const optionsTotal = allSelected.reduce((s, o) => s + o.priceModifier, 0)
  const unitPrice = product.price + optionsTotal
  const lineTotal = unitPrice * qty

  function handleAdd() {
    if (!isValid()) return
    onAdd({
      cartId: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      unitPrice,
      basePrice: product.price,
      quantity: qty,
      notes,
      options: allSelected,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-gray-900">{product.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">R$ {product.price.toFixed(2)} base</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
          {product.optionGroups.map(group => (
            <div key={group.id}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-900">{group.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  group.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {group.required ? 'Obrigatório' : 'Opcional'}
                  {group.maxChoices > 1 && ` · até ${group.maxChoices}`}
                </span>
              </div>
              <div className="space-y-2">
                {group.options.map(opt => {
                  const isSelected = !!(selected[group.id]?.find(o => o.optionId === opt.id))
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(group, opt)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-sm font-semibold text-gray-900">{opt.name}</span>
                      {opt.priceModifier !== 0 && (
                        <span className="text-sm font-bold text-gray-500">
                          {opt.priceModifier > 0 ? '+' : ''}R$ {opt.priceModifier.toFixed(2)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Observação */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">Observação</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: sem cebola, ponto bem passado..."
              rows={2}
              className="w-full bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 space-y-4">
          {/* Qty stepper */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">Quantidade</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-black text-lg">{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!isValid()}
            className="w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between px-5"
            style={{ backgroundColor: isValid() ? 'var(--color-lime-primary)' : undefined, color: '#000' }}
          >
            <span>Adicionar à comanda</span>
            <span>R$ {lineTotal.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
