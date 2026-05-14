'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface CartFooterProps {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  onCheckout: () => void;
  loading?: boolean;
}

export default function CartFooter({ subtotal, deliveryFee, discount, onCheckout, loading }: CartFooterProps) {
  const total = subtotal + deliveryFee - discount;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 z-40 shadow-lg">
      <div className="max-w-lg mx-auto">
        <div className="flex items-end justify-between mb-3">
          <div className="space-y-0.5 text-sm">
            <div className="flex gap-6">
              <span className="text-gray-500 w-16">Subtotal</span>
              <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex gap-6">
              <span className="text-gray-500 w-16">Entrega</span>
              <span className="font-semibold text-gray-900">{formatCurrency(deliveryFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex gap-6">
                <span className="text-gray-500 w-16">Desconto</span>
                <span className="font-semibold text-emerald-600">-{formatCurrency(discount)}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total</p>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(total)}</p>
          </div>
        </div>
        <Button variant="dark" size="xl" className="w-full" onClick={onCheckout} loading={loading}>
          Finalizar Pedido <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
