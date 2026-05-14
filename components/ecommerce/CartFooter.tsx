'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

interface CartFooterProps {
  subtotal: number
  deliveryFee: number
  discount: number
  onCheckout: () => void
  loading?: boolean
}

export default function CartFooter({ subtotal, deliveryFee, discount, onCheckout, loading }: CartFooterProps) {
  const total = subtotal + deliveryFee - discount

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[40px] px-8 pt-6 pb-6 shadow-[0_-15px_30px_rgba(0,0,0,0.04)] z-50 border-t border-black/[0.02]">
      <div className="space-y-2.5 mb-7 px-1">
        <div className="flex justify-between items-center text-[15px]">
          <span className="text-gray-500 font-semibold">Subtotal:</span>
          <span className="font-extrabold text-gray-900">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center text-[15px]">
          <span className="text-gray-500 font-semibold">Delivery:</span>
          <span className="font-extrabold text-gray-900">{formatCurrency(deliveryFee)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-[15px]">
            <span className="text-gray-500 font-semibold">Desconto:</span>
            <span className="font-extrabold text-[var(--color-app-accent)]">-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-gray-900 font-bold">Total:</span>
          <span className="font-extrabold text-gray-900 text-lg">{formatCurrency(total)}</span>
        </div>
      </div>
      <Button variant="dark" className="w-full py-7" onClick={onCheckout} loading={loading}>
        Finalizar Pedido
      </Button>
    </div>
  )
}
