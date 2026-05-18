'use client'

import React, { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import Image from 'next/image'
import type { PDVMenuCategory, PDVProduct, CartItem } from './types'
import { PDVProductModal } from './PDVProductModal'

interface Props {
  categories: PDVMenuCategory[]
  onAddItem: (item: CartItem) => void
}

export function PDVCatalog({ categories, onAddItem }: Props) {
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [modalProduct, setModalProduct] = useState<PDVProduct | null>(null)

  const allProducts = categories.flatMap(c => c.products)

  const displayProducts = (selectedCat === 'all'
    ? allProducts
    : categories.find(c => c.id === selectedCat)?.products ?? []
  ).filter(p =>
    p.available &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleProductClick(product: PDVProduct) {
    if (product.optionGroups?.length > 0) {
      setModalProduct(product)
    } else {
      onAddItem({
        cartId: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        basePrice: product.price,
        quantity: 1,
        notes: '',
        options: [],
      })
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Search bar */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-3 bg-white border-b border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedCat('all') }}
            className="w-full bg-gray-50 rounded-xl py-2.5 pl-9 pr-4 text-sm border border-gray-200 focus:ring-2 focus:ring-[var(--color-lime-primary)] focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar bg-white border-b border-gray-100 shrink-0">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            selectedCat === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos ({allProducts.filter(p => p.available).length})
        </button>
        {categories.map(cat => {
          const count = cat.products.filter(p => p.available).length
          if (!count) return null
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                selectedCat === cat.id ? 'text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={selectedCat === cat.id ? { backgroundColor: 'var(--color-lime-primary)' } : {}}
            >
              {cat.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
        {displayProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Search className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {displayProducts.map(product => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-2xl p-3 border-2 border-transparent hover:border-[var(--color-lime-primary)] cursor-pointer transition-all group shadow-sm text-left relative active:scale-95"
              >
                <div className="aspect-square bg-gray-50 rounded-xl mb-2.5 overflow-hidden relative">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🍽️
                    </div>
                  )}
                  {product.optionGroups?.length > 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      + opções
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-xs leading-tight line-clamp-2 mb-1">
                  {product.name}
                </h3>
                <p className="text-sm font-black text-gray-900">
                  R$ {product.price.toFixed(2)}
                </p>
                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-gray-100 group-hover:bg-[var(--color-lime-primary)] flex items-center justify-center transition-all">
                  <Plus className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-900" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {modalProduct && (
        <PDVProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onAdd={item => { onAddItem(item); setModalProduct(null) }}
        />
      )}
    </div>
  )
}
