'use client';

import React from 'react';
import { StoreImage } from '@/components/ui/StoreImage';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { CartItem as CartItemType } from '@/store/cart-store';
import { formatCurrency } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
  onRemove: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function CartItem({ item, onRemove, onIncrement, onDecrement }: CartItemProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 shadow-sm">
      {/* Image */}
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 relative border border-gray-50">
        {item.imageUrl ? (
          <StoreImage src={item.imageUrl} alt={item.name} fill className="object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-gray-200" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1 flex-1">{item.name}</h3>
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {item.selectedOptions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.selectedOptions.map((opt) => (
              <span key={opt.optionId} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                {opt.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2.5">
          <span className="font-black text-gray-900 text-base">{formatCurrency(item.itemTotal)}</span>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
            <button onClick={onDecrement} className="w-6 h-6 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Minus className="w-3 h-3 text-gray-600" strokeWidth={2.5} />
            </button>
            <span className="font-black text-gray-900 text-sm w-4 text-center">{item.quantity}</span>
            <button onClick={onIncrement} className="w-6 h-6 rounded-lg bg-[var(--color-lime-primary)] flex items-center justify-center hover:brightness-95 transition-all">
              <Plus className="w-3 h-3 text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
