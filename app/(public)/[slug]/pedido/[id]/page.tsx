'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, CreditCard, Package, Copy, CheckCircle2, Clock } from 'lucide-react';
import { useOrder } from '@/hooks/use-orders';
import { useSocket } from '@/hooks/use-socket';
import OrderTracker from '@/components/ecommerce/OrderTracker';
import { Skeleton } from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function OrderStatusPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const router = useRouter();
  const { data: order, isLoading, refetch } = useOrder(id, false);

  useSocket(`order:${id}`, {
    'order:update': (data: any) => {
      if (data.orderId === id) {
        refetch()
        toast.success(`Status atualizado: ${data.status}`)
      }
    },
  });

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
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

  const isPix = order.paymentMethod === 'pix';
  const pixPending = isPix && order.paymentStatus === 'pending';
  const pixApproved = isPix && order.paymentStatus === 'approved';

  return (
    <div className="min-h-screen bg-gray-50">
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

          {/* Left column */}
          <div className="lg:col-span-3 space-y-4 mb-5 lg:mb-0">

            {/* PIX payment section */}
            {isPix && (
              <div className={`rounded-2xl border shadow-sm p-6 ${pixApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100'}`}>
                {pixApproved ? (
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    </div>
                    <p className="font-black text-emerald-800 text-lg">Pagamento confirmado!</p>
                    <p className="text-emerald-600 text-sm">Seu pedido está sendo preparado.</p>
                  </div>
                ) : pixPending && order.pixQrCode ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Clock className="w-4 h-4" />
                      <p className="text-sm font-bold">Aguardando pagamento PIX</p>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Escaneie o QR Code ou copie o código Pix Copia e Cola
                    </p>

                    {order.pixQrBase64 && (
                      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <Image
                          src={`data:image/png;base64,${order.pixQrBase64}`}
                          alt="QR Code PIX"
                          width={200}
                          height={200}
                          className="mx-auto"
                          unoptimized
                        />
                      </div>
                    )}

                    <div className="w-full">
                      <p className="text-xs text-gray-400 font-medium mb-1.5">Pix Copia e Cola</p>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 flex-1 break-all line-clamp-2 font-mono">
                          {order.pixQrCode}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(order.pixQrCode!);
                            toast.success('Código copiado!');
                          }}
                          className="shrink-0 p-1.5 rounded-lg bg-[var(--color-lime-primary)] text-white hover:brightness-90"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {order.pixExpiresAt && (
                      <p className="text-xs text-gray-400">
                        Expira em: {new Date(order.pixExpiresAt).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                ) : pixPending && !order.pixQrCode ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Clock className="w-8 h-8 text-amber-500" />
                    <p className="text-sm font-bold text-amber-700">QR Code PIX não gerado</p>
                    <p className="text-xs text-gray-400">O gateway de pagamento não está configurado. Entre em contato com a loja.</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Order tracker (hide when PIX pending) */}
            {!pixPending && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-6">Acompanhamento</h2>
                <OrderTracker status={order.status} />
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
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

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-[var(--color-lime-primary)] uppercase tracking-wider mb-3">Itens do pedido</h3>
              <div className="space-y-2.5 mb-4">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-start justify-between gap-2 text-sm">
                    <div className="flex gap-2 flex-1 min-w-0">
                      <span className="font-black text-[var(--color-lime-primary)] shrink-0">{item.quantity}×</span>
                      <p className="font-semibold text-gray-900 line-clamp-1">{item.product.name}</p>
                    </div>
                    <span className="text-gray-500 shrink-0 text-sm">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--color-lime-primary)]/20 pt-3 flex justify-between items-center">
                <span className="text-sm text-gray-500">Total</span>
                <span className="font-black text-gray-900 text-lg">{formatCurrency(order.total)}</span>
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
