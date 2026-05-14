'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Landmark, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useCreateOrder, usePayOrder } from '@/hooks/use-orders';
import CheckoutForm from '@/components/ecommerce/CheckoutForm';
import PaymentFormMP from '@/components/ecommerce/PaymentFormMP';
import PaymentFormPB from '@/components/ecommerce/PaymentFormPB';
import Modal from '@/components/ui/Modal';
import useSessionStore from '@/store/session-store';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { tenant } = useSessionStore();
  const { items, total, cartSubtotal, deliveryFee, isEmpty, clearCart } = useCart();
  
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);

  const { mutate: createOrder, isPending: isCreating } = useCreateOrder();
  const { mutate: payOrder, isPending: isPaying } = usePayOrder();

  const handleCheckoutSubmit = (data: any) => {
    if (!tenant) return;
    setCheckoutData(data);

    const payload = {
      restaurantId: tenant.id,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        options: i.selectedOptions.map((o) => o.optionId),
      })),
      deliveryType: data.deliveryType,
      address: data.deliveryType === 'delivery' ? data.address : null,
      customerName: data.name,
      customerPhone: data.phone,
      paymentMethod: data.paymentMethod,
    };

    createOrder(payload, {
      onSuccess: (response: any) => {
        setOrderId(response.orderId);
        if (data.paymentMethod === 'pix') {
          router.push(`/${slug}/pedido/${response.orderId}`);
          clearCart();
        } else {
          setShowPaymentModal(true);
        }
      },
      onError: (err: any) => {
        toast.error(err.message || 'Erro ao criar pedido');
      }
    });
  };

  const handlePaymentSuccess = (token: string) => {
    if (!orderId) return;

    payOrder({
      id: orderId,
      paymentData: {
        token,
        method: checkoutData.paymentMethod,
      }
    }, {
      onSuccess: () => {
        toast.success('Pagamento processado!');
        setShowPaymentModal(false);
        clearCart();
        router.push(`/${slug}/pedido/${orderId}`);
      },
      onError: (err: any) => {
        toast.error(err.message || 'Erro no pagamento');
      }
    });
  };

  if (isEmpty && !orderId) {
    router.push(`/${slug}/cart`);
    return null;
  }

  return (
    <main className="flex-1 flex flex-col bg-[#fcfcfc] overflow-y-auto no-scrollbar">
      <header className="flex items-center px-6 py-12 sticky top-0 bg-[#fcfcfc]/80 backdrop-blur-md z-10">
        <Link
          href={`/${slug}/cart`}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/5 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-900 mr-10">Checkout</h1>
      </header>

      <div className="px-6 pb-20">
        <div className="bg-[var(--color-lime-primary)]/10 rounded-[32px] p-6 mb-8 border border-[var(--color-lime-primary)]/20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Resumo</span>
            <span className="text-xs font-bold text-[var(--color-lime-primary)] bg-black px-3 py-1 rounded-full">
              {items.length} ITENS
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold text-gray-900">R$ {cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Taxa de entrega</span>
              <span className="font-bold text-gray-900">R$ {deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg pt-3 border-t border-black/5 mt-2">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-black text-gray-900">R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <CheckoutForm onSubmit={handleCheckoutSubmit} loading={isCreating} />
      </div>

      <Modal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Pagamento"
      >
        <div className="p-2">
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-500 mb-1">Valor a pagar</p>
            <p className="text-3xl font-black text-gray-900">R$ {total.toFixed(2)}</p>
          </div>

          {tenant?.gateway === 'mercadopago' ? (
            <PaymentFormMP
              amount={total}
              onSuccess={handlePaymentSuccess}
              loading={isPaying}
            />
          ) : (
            <PaymentFormPB
              amount={total}
              onSuccess={handlePaymentSuccess}
              loading={isPaying}
            />
          )}
          
          <p className="mt-6 text-[10px] text-gray-400 text-center leading-relaxed">
            Seus dados de pagamento são processados de forma segura pelo {tenant?.gateway === 'mercadopago' ? 'Mercado Pago' : 'PagBank'}. Não armazenamos os dados do seu cartão.
          </p>
        </div>
      </Modal>
    </main>
  );
}
