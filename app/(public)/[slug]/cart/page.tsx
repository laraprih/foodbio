'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Tag } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import CartItem from '@/components/ecommerce/CartItem';
import CartFooter from '@/components/ecommerce/CartFooter';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { use } from 'react';

export default function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { items, isEmpty, count, cartSubtotal, deliveryFee, total, updateQuantity, removeFromCart, clearCart } = useCart();

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-20">
          <Link href={`/${slug}`} className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </Link>
          <h1 className="font-black text-gray-900 text-lg">Carrinho</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-5 border border-gray-100">
            <ShoppingBag className="w-9 h-9 text-gray-300" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Carrinho vazio</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xs">Adicione itens do cardápio para continuar com seu pedido.</p>
          <Button variant="dark" size="lg" onClick={() => router.push(`/${slug}`)}>
            Ver Cardápio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link href={`/${slug}`} className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </Link>
          <h1 className="font-black text-gray-900 text-lg">Meu Carrinho</h1>
          <span className="ml-auto text-sm font-semibold text-gray-400">{count} ite{count !== 1 ? 'ns' : 'm'}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-48 lg:pb-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Itens</p>
              <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors">
                Remover todos
              </button>
            </div>
            {items.map((item) => (
              <CartItem
                key={`${item.productId}-${JSON.stringify(item.selectedOptions)}`}
                item={item}
                onIncrement={() => updateQuantity(item.productId, item.quantity + 1)}
                onDecrement={() => updateQuantity(item.productId, item.quantity - 1)}
                onRemove={() => removeFromCart(item.productId)}
              />
            ))}

            {/* Cupom placeholder */}
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-4 flex items-center gap-3 mt-4">
              <Tag className="w-5 h-5 text-gray-300 shrink-0" />
              <input
                type="text"
                placeholder="Tem um cupom de desconto?"
                className="flex-1 text-sm text-gray-600 placeholder-gray-300 outline-none bg-transparent"
              />
              <button className="text-xs font-bold text-white bg-[var(--color-lime-primary)] px-3 py-1.5 rounded-lg hover:brightness-90 transition-all">
                Aplicar
              </button>
            </div>
          </div>

          {/* Desktop summary */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4">Resumo do pedido</h2>
              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal ({count} iten{count !== 1 ? 's' : ''})</span>
                  <span className="font-semibold">{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxa de entrega</span>
                  <span className="font-semibold">{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-base">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-black text-gray-900">{formatCurrency(total)}</span>
                </div>
              </div>
              <Button variant="dark" size="lg" className="w-full" onClick={() => router.push(`/${slug}/checkout`)}>
                Ir para Checkout
              </Button>
              <Link href={`/${slug}`} className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-3 transition-colors">
                Continuar comprando
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="lg:hidden">
        <CartFooter subtotal={cartSubtotal} deliveryFee={deliveryFee} discount={0} onCheckout={() => router.push(`/${slug}/checkout`)} loading={false} />
      </div>
    </div>
  );
}
