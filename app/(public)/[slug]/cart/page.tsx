'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useCreateOrder } from '@/hooks/use-orders';
import CartItem from '@/components/ecommerce/CartItem';
import CartFooter from '@/components/ecommerce/CartFooter';
import { Button } from '@/components/ui/Button';
import useSessionStore from '@/store/session-store';

import { use } from 'react';

export default function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { tenant } = useSessionStore();
  const {
    items,
    isEmpty,
    count,
    cartSubtotal,
    deliveryFee,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const { mutate: createOrder, isPending: isCreating } = useCreateOrder();

  const handleCheckout = () => {
    if (!tenant) return;
    
    const orderData = {
      restaurantId: tenant.id,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        options: i.selectedOptions.map((o) => o.optionId),
      })),
      deliveryType: 'delivery', // Default
    };

    createOrder(orderData);
  };

  if (isEmpty) {
    return (
      <main className="flex-1 flex flex-col bg-white">
        <header className="flex items-center px-6 py-12">
          <Link
            href={`/${slug}`}
            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </Link>
          <h1 className="flex-1 text-center text-lg font-bold text-gray-900 mr-10">Carrinho</h1>
        </header>
        
        <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Seu carrinho está vazio</h2>
          <p className="text-gray-500 mb-8">Parece que você ainda não adicionou nenhum item ao seu carrinho.</p>
          <Button onClick={() => router.push(`/${slug}`)} className="w-full">
            Ver Cardápio
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative bg-[#fcfcfc] pb-80">
      <header className="flex items-center justify-between px-6 py-12 sticky top-0 bg-[#fcfcfc]/80 backdrop-blur-md z-10">
        <Link
          href={`/${slug}`}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/5 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Meu Carrinho</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 flex-1 pt-2">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[17px] font-extrabold text-gray-900">{count} itens</span>
          <button
            onClick={clearCart}
            className="text-sm font-semibold text-red-500 hover:text-red-600"
          >
            Limpar tudo
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <CartItem
              key={`${item.productId}-${JSON.stringify(item.selectedOptions)}`}
              item={item}
              onIncrement={() => updateQuantity(item.productId, item.quantity + 1)}
              onDecrement={() => updateQuantity(item.productId, item.quantity - 1)}
              onRemove={() => removeFromCart(item.productId)}
            />
          ))}
        </div>
      </div>

      <CartFooter
        subtotal={cartSubtotal}
        deliveryFee={deliveryFee}
        discount={0} // TODO: Implement discounts
        onCheckout={handleCheckout}
        loading={isCreating}
      />
    </main>
  );
}
