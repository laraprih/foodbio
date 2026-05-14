'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Heart, Clock, Star, ShieldCheck, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Option {
  id: string;
  name: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  options?: Option[];
}

interface ProductDetailProps {
  product: Product;
  onAdd: (product: any, options: any[]) => void;
  loading?: boolean;
}

export default function ProductDetail({ product, onAdd, loading }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);

  const toggleOption = (option: Option) => {
    setSelectedOptions((prev) =>
      prev.find((o) => o.id === option.id)
        ? prev.filter((o) => o.id !== option.id)
        : [...prev, option]
    );
  };

  const optionsPrice = selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
  const unitPrice = product.price + optionsPrice;
  const totalPrice = unitPrice * quantity;

  return (
    <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative bg-[#f5faed]">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between z-10 relative">
        <Link
          href="/"
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">Detalhes</h1>
        <button className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-[0_2px_10px_-4px_rgba(239,68,68,0.4)] active:scale-95 transition-transform">
          <Heart className="w-5 h-5 fill-white text-white" />
        </button>
      </header>

      {/* Product Image Area */}
      <div className="flex flex-col items-center pt-2 pb-6 relative z-0">
        <div className="absolute top-0 right-0 left-0 h-[200px] bg-gradient-to-b from-[#e6f7cf] to-transparent opacity-60 z-[-1]" />
        <div className="w-[280px] h-[280px] relative drop-shadow-[0_25px_35px_rgba(0,0,0,0.15)] mb-8">
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>

      {/* Product Info Content */}
      <section className="px-6 pb-[120px] bg-gray-50 flex-1 rounded-t-[40px] pt-8 -mt-6 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="mb-5">
          <h2 className="text-[26px] leading-tight font-extrabold text-gray-900">
            {product.name}
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50/80 border border-green-100 rounded-[14px]">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-700">Verificado</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50/80 border border-blue-100 rounded-[14px]">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-700">10-20 min</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-yellow-50/80 border border-yellow-100 rounded-[14px]">
            <Star className="w-4 h-4 text-yellow-600 fill-yellow-500" />
            <span className="text-xs font-bold text-yellow-700">4.5</span>
          </div>
        </div>

        <div className="mb-6 text-gray-500 text-[13px] leading-relaxed font-medium">
          {product.description || 'Nenhuma descrição disponível para este produto.'}
        </div>

        {/* Options Selection */}
        {product.options && product.options.length > 0 && (
          <div className="mb-6">
            <h3 className="text-gray-900 font-bold text-sm mb-4">Personalize</h3>
            <div className="space-y-3">
              {product.options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => toggleOption(option)}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer',
                    selectedOptions.find((o) => o.id === option.id)
                      ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)]/5'
                      : 'border-gray-100 bg-white'
                  )}
                >
                  <span className="text-sm font-semibold text-gray-700">
                    {option.name}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    +R$ {option.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Sticky Bottom Footer */}
      <footer className="absolute bottom-0 left-0 w-full bg-white p-6 pb-8 border-t border-gray-100 flex items-center justify-between z-50 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col">
          <span className="text-gray-400 text-[11px] font-semibold mb-0.5">
            Valor Total
          </span>
          <span className="text-[26px] font-extrabold text-gray-900 leading-none">
            R$ {totalPrice.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center">
          <div className="flex items-center space-x-4 mr-5 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-100">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="text-gray-400 font-bold text-xl active:scale-95 transition-transform"
            >
              <Minus className="w-4 h-4" strokeWidth={3} />
            </button>
            <span className="text-gray-900 font-bold text-lg w-4 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-[28px] h-[28px] bg-[#84cc16] rounded-full text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4 text-white" strokeWidth={3} />
            </button>
          </div>
          <Button
            variant="dark"
            className="px-7 h-14"
            onClick={() => onAdd(product, selectedOptions)}
            loading={loading}
          >
            Adicionar
          </Button>
        </div>
      </footer>
    </main>
  );
}
