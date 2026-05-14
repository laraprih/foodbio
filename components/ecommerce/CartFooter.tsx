'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

interface CartFooterProps {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  onCheckout: () => void;
  loading?: boolean;
}

export default function CartFooter({
  subtotal,
  deliveryFee,
  discount,
  onCheckout,
  loading,
}: CartFooterProps) {
  const total = subtotal + deliveryFee - discount;

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[40px] px-8 pt-6 pb-6 shadow-[0_-15px_30px_rgba(0,0,0,0.04)] z-50 border-t border-black/[0.02]">
      <div className="space-y-2.5 mb-7 px-1">
        <div className="flex justify-between items-center text-[15px]">
          <span className="text-gray-500 font-semibold">Subtotal:</span>
          <span className="font-extrabold text-gray-900">R$ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-[15px]">
          <span className="text-gray-500 font-semibold">Delivery:</span>
          <span className="font-extrabold text-gray-900">R$ {deliveryFee.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-[15px]">
            <span className="text-gray-500 font-semibold">Desconto:</span>
            <span className="font-extrabold text-[#9acc28]">-R$ {discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-gray-900 font-bold">Total:</span>
          <span className="font-extrabold text-gray-900 text-lg">R$ {total.toFixed(2)}</span>
        </div>
      </div>

      <Button
        variant="dark"
        className="w-full py-7"
        onClick={onCheckout}
        loading={loading}
      >
        Finalizar Pedido
      </Button>
    </div>
  );
}
