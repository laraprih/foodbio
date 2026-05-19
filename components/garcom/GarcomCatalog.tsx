'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { X, ShoppingBag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { GarcomProductModal } from './GarcomProductModal'
import type { GarcomCategory, GarcomProduct, CartItem } from './types'

interface GarcomCatalogProps {
  categories: GarcomCategory[]
  cart: CartItem[]
  onAddToCart: (item: CartItem) => void
  onViewCart: () => void
  onClose: () => void
  isLoading?: boolean
}

export function GarcomCatalog({
  categories,
  cart,
  onAddToCart,
  onViewCart,
  onClose,
  isLoading,
}: GarcomCatalogProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id ?? '')
  const [selectedProduct, setSelectedProduct] = useState<GarcomProduct | null>(null)

  const cartTotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0)

  const activeCategory = categories.find(c => c.id === activeCategoryId) ?? categories[0]

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 bg-white flex flex-col">
        <div className="h-14 bg-gray-100 animate-pulse" />
        <div className="h-12 bg-gray-50 animate-pulse border-b" />
        <div className="flex-1 p-4 space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center h-14 px-4 gap-3">
          <button onClick={onClose} className="p-2 -ml-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-bold text-gray-900 flex-1">Cardápio</span>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto gap-1 px-4 pb-3 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`flex-none text-sm font-semibold px-4 py-1.5 rounded-full transition-all whitespace-nowrap ${
                activeCategoryId === cat.id
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 bg-gray-100'
              }`}
              style={activeCategoryId === cat.id
                ? { backgroundColor: 'var(--color-lime-primary, #84cc16)' }
                : undefined
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Products */}
      <div className="flex-1 overflow-y-auto pb-28">
        {!activeCategory?.products.length ? (
          <p className="text-center text-gray-400 text-sm py-12">Sem produtos nesta categoria</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {activeCategory.products.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="w-full flex items-center gap-4 px-5 py-4 active:bg-gray-50 transition-colors text-left"
              >
                {/* Image */}
                {product.imageUrl ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-none bg-gray-100">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex-none flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-gray-300" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</p>
                  {product.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                  <p className="text-sm font-bold mt-1.5" style={{ color: 'var(--color-lime-primary, #65a30d)' }}>
                    {formatCurrency(product.price)}
                  </p>
                </div>

                <div className="flex-none w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400">
                  <span className="text-lg leading-none mb-0.5">+</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart footer */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <button
            onClick={onViewCart}
            className="w-full h-13 rounded-2xl font-bold text-white text-sm flex items-center justify-between px-5 py-3.5 active:scale-98 transition-all shadow-lg"
            style={{ backgroundColor: 'var(--color-lime-primary, #84cc16)' }}
          >
            <span className="bg-white/30 rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">
              {cartCount}
            </span>
            <span>Ver pedido</span>
            <span>{formatCurrency(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Product modal */}
      {selectedProduct && (
        <GarcomProductModal
          product={selectedProduct}
          onAdd={item => { onAddToCart(item); setSelectedProduct(null) }}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}
