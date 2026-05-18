'use client';

import React, { useEffect, useState } from 'react';
import { StoreImage } from '@/components/ui/StoreImage';
import { X, Minus, Plus, ShoppingCart, ChefHat, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface Option {
  id: string;
  name: string;
  price: number;
}

interface OptionGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelections: number;
  minSelections?: number;
  options: Option[];
}

interface ProductBasic {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  available: boolean;
}

interface ProductModalProps {
  product: ProductBasic | null;
  slug: string;
  onClose: () => void;
  onAdd: (product: ProductBasic, options: Option[], quantity: number) => void;
}

export default function ProductModal({ product, slug, onClose, onAdd }: ProductModalProps) {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [attemptedAdd, setAttemptedAdd] = useState(false);

  useEffect(() => {
    if (!product) return;
    setSelectedOptions([]);
    setQuantity(1);
    setOptionGroups([]);
    setAttemptedAdd(false);
    setLoadingOptions(true);

    fetch(`/api/store/${slug}/products/${product.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.optionGroups) setOptionGroups(data.optionGroups);
      })
      .catch(() => {})
      .finally(() => setLoadingOptions(false));
  }, [product?.id, slug]);

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  if (!product) return null;

  const toggleOption = (opt: Option, group: OptionGroup) => {
    setSelectedOptions((prev) => {
      const isSelected = prev.some((o) => o.id === opt.id);
      if (isSelected) return prev.filter((o) => o.id !== opt.id);
      const groupSelected = prev.filter((o) => group.options.some((go) => go.id === o.id));
      if (group.maxSelections === 1) {
        return [...prev.filter((o) => !group.options.some((go) => go.id === o.id)), opt];
      }
      if (groupSelected.length >= group.maxSelections) return prev;
      return [...prev, opt];
    });
  };

  const optionsTotal = selectedOptions.reduce((s, o) => s + o.price, 0);
  const unitPrice = product.price + optionsTotal;
  const totalPrice = unitPrice * quantity;

  // Validate required groups
  const incompleteGroups = optionGroups
    .filter((g) => g.required || (g.minSelections ?? 0) > 0)
    .filter((g) => {
      const count = selectedOptions.filter((o) => g.options.some((go) => go.id === o.id)).length;
      const min = (g.minSelections ?? 0) > 0 ? g.minSelections! : (g.required ? 1 : 0);
      return count < min;
    });
  const canAdd = product.available && incompleteGroups.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — altura fixa no mobile evita o efeito elástico de crescer/encolher */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white rounded-t-3xl h-[88dvh] md:h-auto md:max-h-[90dvh] md:max-w-lg md:mx-auto md:left-0 md:right-0 md:rounded-3xl md:bottom-auto md:top-1/2 md:-translate-y-1/2 shadow-2xl animate-slide-up">

        {/* Image — altura fixa evita recalculo de layout ao abrir */}
        <div className="relative w-full h-52 md:h-56 rounded-t-3xl overflow-hidden shrink-0 bg-gray-100">
          {product.imageUrl ? (
            <StoreImage
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-gray-200" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          {!product.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold bg-black/60 px-4 py-2 rounded-full">Indisponível</span>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 pt-4 pb-2">
          <h2 className="font-black text-gray-900 text-xl leading-tight">{product.name}</h2>
          {product.description && (
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{product.description}</p>
          )}
          <p className="font-black text-[var(--color-lime-primary)] text-2xl mt-2">
            {formatCurrency(product.price)}
          </p>

          {/* Option groups */}
          {loadingOptions ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
            </div>
          ) : (
            optionGroups.map((group) => {
              const selectedInGroup = selectedOptions.filter((o) => group.options.some((go) => go.id === o.id)).length;
              const minRequired = (group.minSelections ?? 0) > 0 ? group.minSelections! : (group.required ? 1 : 0);
              const groupComplete = selectedInGroup >= minRequired;
              const showError = attemptedAdd && !groupComplete;

              return (
              <div key={group.id} className={cn('mt-5 rounded-2xl transition-all', showError && 'ring-2 ring-red-400 ring-offset-2')}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm">{group.name}</h3>
                    {groupComplete && minRequired > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">✓</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {showError && (
                      <span className="text-[10px] font-bold text-red-500">Escolha uma opção</span>
                    )}
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      group.required
                        ? 'bg-[var(--color-lime-primary)] text-white'
                        : 'bg-gray-100 text-gray-500'
                    )}>
                      {group.required ? 'Obrigatório' : 'Opcional'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {group.options.map((opt) => {
                    const isSelected = selectedOptions.some((o) => o.id === opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleOption(opt, group)}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left',
                          isSelected
                            ? 'border-[var(--color-lime-primary)] bg-[var(--color-app-bg)]'
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                            group.maxSelections === 1 ? 'rounded-full' : 'rounded',
                            isSelected
                              ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)]'
                              : 'border-gray-300'
                          )}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{opt.name}</span>
                        </div>
                        {opt.price > 0 && (
                          <span className="text-sm font-bold text-gray-700 shrink-0">+{formatCurrency(opt.price)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              );
            })
          )}
          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            {/* Quantity */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1.5 shrink-0 border border-gray-100">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Minus className="w-3 h-3 text-gray-600" strokeWidth={2.5} />
              </button>
              <span className="font-black text-gray-900 text-sm w-4 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded-xl bg-[var(--color-lime-primary)] flex items-center justify-center hover:brightness-90 transition-all"
              >
                <Plus className="w-3 h-3 text-white" strokeWidth={2.5} />
              </button>
            </div>

            {/* Add to cart */}
            <button
              disabled={!product.available}
              onClick={() => {
                if (!canAdd) { setAttemptedAdd(true); return; }
                onAdd(product, selectedOptions, quantity);
                onClose();
              }}
              className={cn(
                'flex-1 min-w-0 flex items-center justify-center gap-2 text-white font-bold text-sm py-3 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm',
                canAdd || !product.available
                  ? 'bg-[var(--color-lime-primary)] hover:brightness-90'
                  : 'bg-gray-400 cursor-pointer'
              )}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {canAdd || !attemptedAdd ? `Adicionar · ${formatCurrency(totalPrice)}` : 'Preencha as opções obrigatórias'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
