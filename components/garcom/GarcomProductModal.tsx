'use client'

import React, { useState, useCallback } from 'react'
import { X, Minus, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { GarcomProduct, SelectedOption, CartItem } from './types'

interface GarcomProductModalProps {
  product: GarcomProduct
  onAdd: (item: CartItem) => void
  onClose: () => void
}

export function GarcomProductModal({ product, onAdd, onClose }: GarcomProductModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, SelectedOption[]>>({})

  const toggleOption = useCallback((
    group: GarcomProduct['optionGroups'][0],
    opt: GarcomProduct['optionGroups'][0]['options'][0]
  ) => {
    setSelectedOptions(prev => {
      const groupSel = prev[group.id] ?? []
      const alreadySelected = groupSel.some(o => o.optionId === opt.id)

      if (alreadySelected) {
        return { ...prev, [group.id]: groupSel.filter(o => o.optionId !== opt.id) }
      }

      if (group.maxChoices === 1) {
        return {
          ...prev,
          [group.id]: [{ optionId: opt.id, groupId: group.id, name: opt.name, priceModifier: opt.priceModifier }],
        }
      }

      if (groupSel.length >= group.maxChoices) return prev

      return {
        ...prev,
        [group.id]: [...groupSel, { optionId: opt.id, groupId: group.id, name: opt.name, priceModifier: opt.priceModifier }],
      }
    })
  }, [])

  const optionsTotal = Object.values(selectedOptions)
    .flat()
    .reduce((acc, o) => acc + o.priceModifier, 0)

  const unitPrice = product.price + optionsTotal
  const allOptions = Object.values(selectedOptions).flat()

  const canAdd = product.optionGroups
    .filter(g => g.required)
    .every(g => (selectedOptions[g.id]?.length ?? 0) >= g.minChoices)

  const handleAdd = () => {
    if (!canAdd) return
    onAdd({
      cartId: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      unitPrice,
      quantity,
      notes,
      options: allOptions,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Overlay */}
      <div className="flex-1 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-4 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <h3 className="text-lg font-black text-gray-900 leading-tight">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{product.description}</p>
            )}
            <p className="text-lg font-bold mt-2" style={{ color: 'var(--color-lime-primary, #65a30d)' }}>
              {formatCurrency(product.price)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 -mt-0.5 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable options */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {product.optionGroups.map(group => (
            <div key={group.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-sm text-gray-900">{group.name}</span>
                {group.required ? (
                  <span className="text-[10px] font-semibold text-white bg-gray-800 px-2 py-0.5 rounded-full">
                    Obrigatório
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
                    Opcional
                  </span>
                )}
                {group.maxChoices > 1 && (
                  <span className="text-[10px] text-gray-400">
                    Até {group.maxChoices}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {group.options.map(opt => {
                  const isSelected = (selectedOptions[group.id] ?? []).some(o => o.optionId === opt.id)
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(group, opt)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all active:scale-98 ${
                        isSelected
                          ? 'border-lime-400 bg-lime-50'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <span className={`text-sm font-medium ${isSelected ? 'text-lime-800' : 'text-gray-700'}`}>
                        {opt.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {opt.priceModifier > 0 && (
                          <span className="text-xs text-gray-500">+{formatCurrency(opt.priceModifier)}</span>
                        )}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-lime-500 bg-lime-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Observação */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Observação</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: sem cebola, bem passado..."
              rows={2}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-lime-400 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white space-y-3">
          {/* Qty stepper */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center active:scale-90 transition-all"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-xl font-black text-gray-900 w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center active:scale-90 transition-all"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="w-full h-12 rounded-2xl font-bold text-white text-sm flex items-center justify-between px-5 disabled:opacity-40 active:scale-98 transition-all"
            style={{ backgroundColor: canAdd ? 'var(--color-lime-primary, #84cc16)' : '#d1d5db' } as React.CSSProperties}
          >
            <span>Adicionar {quantity > 1 ? `(${quantity})` : ''}</span>
            <span>{formatCurrency(unitPrice * quantity)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
