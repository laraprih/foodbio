'use client';

import React from 'react';
import { StoreImage } from '@/components/ui/StoreImage';
import { Plus, ShoppingCart } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Spinner from '@/components/ui/Spinner';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  available: boolean;
  slug?: string;
}

interface MenuCardProps {
  product: Product;
  onAdd: (productId: string) => void;
  loading?: boolean;
  restaurantSlug?: string;
  layout?: 'grid' | 'list';
}

export default function MenuCard({
  product,
  onAdd,
  loading,
  restaurantSlug,
  layout = 'grid',
}: MenuCardProps) {
  if (layout === 'list') {
    return (
      <div
        className={cn(
          'bg-white rounded-2xl flex items-center gap-4 p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]',
          !product.available && 'opacity-60'
        )}
        onClick={() => onAdd(product.id)}
      >
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 relative shrink-0">
          {product.imageUrl ? (
            <StoreImage src={product.imageUrl} alt={product.name} fill className="object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-gray-200" />
            </div>
          )}
          {!product.available && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold bg-black/60 px-2 py-0.5 rounded-full uppercase">Indisponível</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{product.name}</h4>
          {product.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{product.description}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="font-black text-gray-900 text-base">{formatCurrency(product.price)}</span>
            <div className="w-8 h-8 rounded-xl bg-[var(--color-lime-primary)] flex items-center justify-center shadow-sm pointer-events-none">
              <Plus className="h-4 w-4 text-white stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group cursor-pointer active:scale-[0.99]',
        !product.available && 'opacity-60'
      )}
      onClick={() => onAdd(product.id)}
    >
      <div className="relative aspect-square bg-gray-50">
        {product.imageUrl ? (
          <StoreImage
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-gray-200" />
          </div>
        )}
        {!product.available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold bg-black/60 px-3 py-1 rounded-full uppercase tracking-wider">
              Indisponível
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h4 className="font-bold text-gray-900 text-[14px] line-clamp-1 leading-snug">{product.name}</h4>
        {product.description && (
          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-black text-gray-900 text-[15px]">{formatCurrency(product.price)}</span>
          <div className="w-8 h-8 rounded-xl bg-[var(--color-lime-primary)] flex items-center justify-center shadow-sm pointer-events-none">
            <Plus className="h-4 w-4 text-white stroke-[2.5]" />
          </div>
        </div>
      </div>
    </div>
  );
}
