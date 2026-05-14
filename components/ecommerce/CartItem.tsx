'use client';

import React from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2, Check } from 'lucide-react';
import { CartItem as CartItemType } from '@/store/cart-store';
import { cn, formatCurrency } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
  onRemove: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function CartItem({
  item,
  onRemove,
  onIncrement,
  onDecrement,
}: CartItemProps) {
  return (
    <div className="bg-white rounded-[28px] p-3.5 flex items-center gap-3.5 relative shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] border border-black/5">
      {/* Checkbox */}
      <div className="relative flex items-center justify-center shrink-0">
        <div className="w-[20px] h-[20px] bg-black rounded-[6px] flex items-center justify-center">
          <Check className="w-3 h-3 text-white" strokeWidth={4} />
        </div>
      </div>

      {/* Product Image */}
      <div className="w-[84px] h-[84px] bg-gray-50 rounded-[22px] overflow-hidden shrink-0 relative border border-black/[0.02]">
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover scale-[1.05]"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 py-1 pr-2">
        <h3 className="text-[15px] font-bold text-gray-900 leading-tight line-clamp-1">
          {item.name}
        </h3>
        
        {/* Selected Options Pills */}
        <div className="flex flex-wrap gap-1 mt-1 mb-2.5">
          {item.selectedOptions.map((opt) => (
            <span
              key={opt.optionId}
              className="text-[9px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium"
            >
              {opt.name} (+{formatCurrency(opt.price)})
            </span>
          ))}
          {item.selectedOptions.length === 0 && (
            <span className="text-[11px] text-gray-400 font-medium">Preço base</span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[15px] font-extrabold text-gray-900">
            {formatCurrency(item.itemTotal)}
          </span>
          
          <div className="flex items-center gap-3.5 bg-gray-50/80 border border-gray-100 rounded-full px-2.5 py-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
            <button
              onClick={onDecrement}
              className="text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
            >
              <Minus className="w-3.5 h-3.5" strokeWidth={3} />
            </button>
            <span className="text-[13px] font-extrabold text-gray-900 w-3 text-center">
              {item.quantity}
            </span>
            <button
              onClick={onIncrement}
              className="w-[22px] h-[22px] bg-[#bef264] rounded-full flex items-center justify-center text-zinc-800 shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-[18px] right-[18px] text-gray-300 hover:text-red-500 transition-colors"
      >
        <Trash2 className="w-[15px] h-[15px]" strokeWidth={2.5} />
      </button>
    </div>
  );
}
