'use client';

import React, { useState } from 'react';
import { StoreImage } from '@/components/ui/StoreImage';
import Link from 'next/link';
import { ArrowLeft, Heart, Star, Clock, Minus, Plus, ShieldCheck, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn, formatCurrency } from '@/lib/utils';

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
  slug?: string;
}

export default function ProductDetail({ product, onAdd, loading, slug }: ProductDetailProps) {
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
    <div className="min-h-screen bg-white lg:bg-gray-50">
      {/* Mobile/Tablet: stacked. Desktop: 2-col */}
      <div className="max-w-5xl mx-auto lg:pt-8 lg:pb-12 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:bg-white lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100 lg:overflow-hidden">

          {/* Image column */}
          <div className="relative">
            {/* Back button (mobile) */}
            <div className="absolute top-4 left-4 z-10 lg:hidden">
              <Link
                href={slug ? `/${slug}` : '/'}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md"
              >
                <ArrowLeft className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
              </Link>
            </div>
            <div className="absolute top-4 right-4 z-10 lg:hidden">
              <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                <Heart className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Product image */}
            <div className="aspect-square lg:aspect-auto lg:h-full relative bg-gray-50 lg:min-h-[480px]">
              {product.imageUrl ? (
                <StoreImage
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 min-h-[300px]">
                  <ChefHat className="w-16 h-16 text-gray-200" />
                  <span className="text-sm text-gray-300">Sem imagem</span>
                </div>
              )}
            </div>
          </div>

          {/* Info column */}
          <div className="px-5 py-6 lg:px-8 lg:py-8 flex flex-col">
            {/* Desktop back button */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <Link
                href={slug ? `/${slug}` : '/'}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao cardápio
              </Link>
              <button className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Heart className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Product name */}
            <h1 className="text-2xl lg:text-3xl font-black text-gray-900 leading-tight mb-2">
              {product.name}
            </h1>

            {/* Meta pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                4.8
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                10-20 min
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verificado
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Options */}
            {product.options && product.options.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Personalize seu pedido
                </h3>
                <div className="space-y-2">
                  {product.options.map((option) => {
                    const isSelected = !!selectedOptions.find((o) => o.id === option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => toggleOption(option)}
                        className={cn(
                          'w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all text-sm',
                          isSelected
                            ? 'border-zinc-900 bg-zinc-50'
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-colors shrink-0',
                              isSelected ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)]' : 'border-gray-300'
                            )}
                          >
                            {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                          </div>
                          <span className="font-semibold text-gray-800">{option.name}</span>
                        </div>
                        <span className="font-bold text-gray-900 shrink-0">+{formatCurrency(option.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Price + Add to cart */}
            <div className="bg-gray-50 rounded-2xl p-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Total</p>
                  <p className="text-2xl font-black text-gray-900">{formatCurrency(totalPrice)}</p>
                </div>

                {/* Quantity selector */}
                <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5 text-gray-600" strokeWidth={2.5} />
                  </button>
                  <span className="font-black text-gray-900 text-base w-5 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-[var(--color-lime-primary)] flex items-center justify-center hover:brightness-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <Button
                variant="dark"
                size="xl"
                className="w-full"
                onClick={() => onAdd(product, selectedOptions)}
                loading={loading}
              >
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
