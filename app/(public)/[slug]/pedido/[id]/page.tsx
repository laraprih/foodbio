'use client';

import React, { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, CreditCard, ChevronRight } from 'lucide-react';
import { useOrder } from '@/hooks/use-orders';
import { useSocket } from '@/hooks/use-socket';
import OrderTracker from '@/components/ecommerce/OrderTracker';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';

export default function OrderStatusPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const router = useRouter();
  const { socket, connected } = useSocket(`order:${id}`);
  const { data: order, isLoading, refetch } = useOrder(id, connected);

  useEffect(() => {
    if (!socket) return;

    socket.on('order:update', (data) => {
      if (data.orderId === id) {
        refetch();
        toast.success(`Pedido atualizado: ${data.status}`);
      }
    });

    return () => {
      socket.off('order:update');
    };
  }, [socket, id, refetch]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <Spinner size="lg" className="text-[var(--color-lime-primary)]" />
      </div>
    );
  }

  if (!order || 'error' in order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Pedido não encontrado</h1>
        <p className="text-gray-500 mb-8">Não conseguimos localizar as informações deste pedido.</p>
        <Link href={`/${slug}`} className="w-full max-w-xs">
          <button className="w-full py-4 bg-black text-white rounded-2xl font-bold">
            Voltar para a Loja
          </button>
        </Link>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-[#fcfcfc] overflow-y-auto no-scrollbar">
      <header className="flex items-center justify-between px-6 py-12 sticky top-0 bg-[#fcfcfc]/80 backdrop-blur-md z-10">
        <Link
          href={`/${slug}`}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/5 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </Link>
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Status do Pedido</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">#{id.slice(-6)}</p>
        </div>
        <div className="w-10" />
      </header>

      <div className="px-6 pb-20">
        {/* Tracker Section */}
        <section className="bg-white rounded-[32px] p-6 mb-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] border border-black/5">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
            <h2 className="font-black text-gray-900 text-xl">Acompanhamento</h2>
            <Badge status={order.status} />
          </div>
          <OrderTracker status={order.status} />
        </section>

        {/* Order Details */}
        <section className="space-y-4">
          {/* Delivery Info */}
          <div className="bg-white rounded-[28px] p-5 border border-black/5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">Entregar em</p>
                <p className="text-sm font-bold text-gray-900">
                  {order.deliveryType === 'delivery' 
                    ? `${order.address.street}, ${order.address.number}` 
                    : 'Retirada no Balcão'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">Contato</p>
                <p className="text-sm font-bold text-gray-900">{order.customerPhone}</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-[28px] p-5 border border-black/5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">Pagamento</p>
                <p className="text-sm font-bold text-gray-900 uppercase">{order.paymentMethod}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">Total</p>
              <p className="text-lg font-black text-gray-900">R$ {order.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Item List Summary */}
          <div className="bg-zinc-900 rounded-[28px] p-6 text-white shadow-xl">
            <h3 className="font-bold text-sm mb-4 uppercase tracking-widest text-[var(--color-lime-primary)]">Resumo do Pedido</h3>
            <div className="space-y-3">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div className="flex gap-2">
                    <span className="font-bold text-[var(--color-lime-primary)]">{item.quantity}x</span>
                    <div>
                      <p className="font-bold">{item.product.name}</p>
                      {item.options?.map((o: any, oIdx: number) => (
                        <p key={oIdx} className="text-[10px] text-gray-400">{o.name}</p>
                      ))}
                    </div>
                  </div>
                  <span className="font-medium text-gray-300">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-auto p-6 bg-white border-t border-gray-50">
        <button
          onClick={() => router.push(`/${slug}`)}
          className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:text-black transition-colors"
        >
          Voltar para o Início
        </button>
      </footer>
    </main>
  );
}
