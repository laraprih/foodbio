'use client';

export const dynamic = 'force-dynamic';

import React, { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, CreditCard, Package } from 'lucide-react';
import { useOrder } from '@/hooks/use-orders';
import { useSocket } from '@/hooks/use-socket';
import OrderTracker from '@/components/ecommerce/OrderTracker';
import { Skeleton } from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function OrderStatusPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const router = useRouter();
  const { socket, connected } = useSocket(`order:${id}`);
  const { data: order, isLoading, refetch } = useOrder(id, connected);

  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      if (data.orderId === id) { refetch(); toast.success(`Status atualizado: ${data.status}`); }
    };
    socket.on('order:update', handler);
    return () => { socket.off('order:update', handler); };
  }, [socket, id, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-5 py-4 flex items-center gap-4">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1.5"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-24" /></div>
            <Skeleton className="h-6 w-24 rounded-full ml-auto" />
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="lg:grid lg:grid-cols-5 lg:gap-8 items-start">
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 mb-5 lg:mb-0 space-y-6">
              <Skeleton className="h-5 w-36" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <Skeleton className="h-3.5 w-32" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                <Skeleton className="h-3.5 w-24" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order || 'error' in order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-gray-300" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">Pedido não encontrado</h1>
        <p className="text-gray-400 text-sm mb-8">Não conseguimos localizar as informações deste pedido.</p>
        <Link href={`/${slug}`} className="bg-[var(--color-lime-primary)] text-white font-bold px-6 py-3 rounded-xl hover:brightness-90 transition-all text-sm">
          Voltar para a Loja
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link href={`/${slug}`} className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </Link>
          <div>
            <h1 className="font-black text-gray-900 text-base leading-tight">Acompanhar Pedido</h1>
            <p className="text-xs text-gray-400 font-mono">#{id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="ml-auto"><Badge status={order.status} /></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="lg:grid lg:grid-cols-5 lg:gap-8 items-start">
          {/* Order tracker */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5 lg:mb-0">
            <h2 className="font-bold text-gray-900 mb-6">Acompanhamento</h2>
            <OrderTracker status={order.status} />
          </div>

          {/* Details sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Delivery info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detalhes da entrega</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Endereço</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {order.type === 'delivery' && order.address
                        ? `${order.address.street}, ${order.address.number} — ${order.address.neighborhood}`
                        : 'Retirada no balcão'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Contato</p>
                    <p className="text-sm font-semibold text-gray-900">{order.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Pagamento</p>
                    <p className="text-sm font-semibold text-gray-900 uppercase">{order.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order items */}
            <div className="bg-[var(--color-app-bg)] rounded-2xl p-5 border border-[var(--color-lime-primary)]/15">
              <h3 className="text-xs font-bold text-[var(--color-lime-primary)] uppercase tracking-wider mb-3">Itens do pedido</h3>
              <div className="space-y-2.5 mb-4">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-start justify-between gap-2 text-sm">
                    <div className="flex gap-2 flex-1 min-w-0">
                      <span className="font-black text-[var(--color-lime-primary)] shrink-0">{item.quantity}×</span>
                      <div className="min-w-0">
                        <p className="font-semibold line-clamp-1">{item.product.name}</p>
                        {item.options?.map((o: any, i: number) => (
                          <p key={i} className="text-[10px] text-zinc-400">{o.name}</p>
                        ))}
                      </div>
                    </div>
                    <span className="text-zinc-400 shrink-0 text-sm">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-sm text-zinc-400">Total</span>
                <span className="font-black text-white text-lg">{formatCurrency(order.total)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push(`/${slug}`)}
              className="w-full py-3 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors bg-white rounded-2xl border border-gray-100"
            >
              Fazer novo pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
