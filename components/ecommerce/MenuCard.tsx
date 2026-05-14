'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
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
}

export default function MenuCard({ product, onAdd, loading, restaurantSlug }: MenuCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-[28px] p-3 block border border-black/5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] relative group hover:shadow-md transition-shadow',
        !product.available && 'opacity-60'
      )}
    >
      <Link href={`/${restaurantSlug}/details/${product.id}`} className="block">
        <div className="mb-3 aspect-square rounded-[24px] overflow-hidden bg-[var(--color-app-bg)] relative">
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover scale-[1.05]"
              referrerPolicy="no-referrer"
            />
          )}
          {!product.available && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="text-white font-bold text-xs bg-black/60 px-3 py-1 rounded-full uppercase tracking-wider">
                Indisponível
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="space-y-1.5 px-2 pb-1">
        <h4 className="font-bold text-zinc-900 text-[15px] line-clamp-1">{product.name}</h4>
        <p className="text-[11px] text-zinc-400 font-medium line-clamp-1">
          {product.description || 'Descrição não disponível'}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="font-extrabold text-zinc-900 text-[17px]">
            R$ {product.price.toFixed(2)}
          </span>
          <button
            disabled={!product.available || loading}
            onClick={(e) => {
              e.preventDefault();
              onAdd(product.id);
            }}
            className="bg-[var(--color-lime-primary)] w-8 h-8 rounded-[10px] shadow-sm flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? (
              <Spinner size="sm" className="text-black" />
            ) : (
              <Plus className="h-4 w-4 text-black stroke-[3]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
