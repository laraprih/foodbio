'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/hooks/use-cart';
import { useCartStore } from '@/store/cart-store';
import { useCreateOrder, usePayOrder } from '@/hooks/use-orders';
import CheckoutForm from '@/components/ecommerce/CheckoutForm';
import PaymentFormMP from '@/components/ecommerce/PaymentFormMP';
import PaymentFormPB from '@/components/ecommerce/PaymentFormPB';
import Modal from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import type { CheckoutData } from '@/types';

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  deliveryFee: number;
  gateway: 'mercadopago' | 'pagbank' | null;
}

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const customer = session?.user as any;

  const { items, total, cartSubtotal, deliveryFee, isEmpty, clearCart } = useCart();
  const restaurantId = useCartStore((s) => s.restaurantId);

  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  const { mutate: createOrder, isPending: isCreating } = useCreateOrder();
  const { mutate: payOrder, isPending: isPaying } = usePayOrder();

  // Fetch store info from slug (resolves gateway and actual deliveryFee)
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/store/${slug}/info`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setStoreInfo(data) })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (isEmpty && !orderId) {
      router.push(`/${slug}/cart`);
    }
  }, [isEmpty, orderId, router, slug]);

  if (isEmpty && !orderId) return null;

  const handleCheckoutSubmit = (data: CheckoutData) => {
    const tenantId = storeInfo?.id ?? restaurantId;

    if (!tenantId) {
      toast.error('Erro ao identificar a loja. Volte ao cardápio e tente novamente.');
      return;
    }

    setCheckoutData(data);
    createOrder(
      {
        restaurantId: tenantId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          options: i.selectedOptions.map((o) => o.optionId),
        })),
        deliveryType: data.deliveryType,
        address: data.deliveryType === 'delivery' ? data.address : undefined,
        customerName: data.name,
        customerPhone: data.phone,
        paymentMethod: data.paymentMethod,
        payerEmail: customer?.email ?? undefined,
      },
      {
        onSuccess: (response) => {
          if (!response || 'error' in response) {
            toast.error((response as any)?.error ?? 'Erro ao criar pedido');
            return;
          }
          setOrderId(response.orderId);
          if (data.paymentMethod === 'pix') {
            clearCart();
            window.location.href = `/${slug}/pedido/${response.orderId}`;
          } else {
            setShowPaymentModal(true);
          }
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar pedido'),
      }
    );
  };

  const handlePaymentSuccess = (token: string) => {
    if (!orderId || !checkoutData) return;
    payOrder(
      {
        id: orderId,
        paymentData: { token, method: checkoutData.paymentMethod, gateway: storeInfo?.gateway ?? '' },
      },
      {
        onSuccess: () => {
          toast.success('Pagamento processado!');
          setShowPaymentModal(false);
          clearCart();
          router.push(`/${slug}/pedido/${orderId}`);
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro no pagamento'),
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            href={`/${slug}/cart`}
            className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </Link>
          <h1 className="font-black text-gray-900 text-lg">Checkout</h1>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            Compra segura
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-10">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 items-start">
          {/* Checkout form */}
          <div className="lg:col-span-2">
            <CheckoutForm
              onSubmit={handleCheckoutSubmit}
              loading={isCreating}
              defaultName={customer?.role === 'customer' ? customer?.name ?? '' : ''}
              defaultPhone={customer?.role === 'customer' ? customer?.phone ?? '' : ''}
            />
          </div>

          {/* Order summary sidebar */}
          <aside className="mt-6 lg:mt-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4">Resumo</h2>

              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto no-scrollbar">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 line-clamp-1 flex-1 mr-2">
                      <span className="font-bold text-gray-900">{item.quantity}×</span> {item.name}
                    </span>
                    <span className="font-semibold text-gray-900 shrink-0">{formatCurrency(item.itemTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Entrega</span>
                  <span className="font-semibold">
                    {storeInfo ? formatCurrency(storeInfo.deliveryFee) : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-base">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-black text-gray-900">
                    {formatCurrency(cartSubtotal + (storeInfo?.deliveryFee ?? deliveryFee))}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Modal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Pagamento">
        <div className="p-2">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-400 mb-1">Valor a pagar</p>
            <p className="text-3xl font-black text-gray-900">
              {formatCurrency(cartSubtotal + (storeInfo?.deliveryFee ?? deliveryFee))}
            </p>
          </div>
          {storeInfo?.gateway === 'mercadopago' ? (
            <PaymentFormMP
              amount={cartSubtotal + (storeInfo?.deliveryFee ?? deliveryFee)}
              onSuccess={handlePaymentSuccess}
              loading={isPaying}
            />
          ) : (
            <PaymentFormPB
              amount={cartSubtotal + (storeInfo?.deliveryFee ?? deliveryFee)}
              onSuccess={handlePaymentSuccess}
              loading={isPaying}
            />
          )}
          <p className="mt-4 text-[10px] text-gray-400 text-center leading-relaxed">
            Dados processados com segurança por{' '}
            {storeInfo?.gateway === 'mercadopago' ? 'Mercado Pago' : 'PagBank'}.
          </p>
        </div>
      </Modal>
    </div>
  );
}
