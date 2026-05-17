'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSectionAuth } from '@/hooks/use-section-auth';
import { get, patch, isApiError } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Navigation, Phone, CheckCircle, Package } from 'lucide-react';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';
import DeliveryCard from '@/components/delivery/DeliveryCard';
import type { Delivery } from '@/types';

interface DeliveryDetail {
  id: string;
  status: 'assigned' | 'picked_up' | 'on_the_way' | 'delivered';
  estimatedMinutes?: number;
  createdAt: string;
  order: {
    id: string;
    total: number;
    items: { quantity: number; product: { name: string } }[];
    customer?: { name: string; phone: string };
    address?: { street: string; number: string; neighborhood: string; city: string };
  };
}

export default function EntregaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const slug = params.slug as string;
  const id = params.id as string;

  const { user, status } = useSectionAuth('entregador');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/${slug}/entregador/login?callbackUrl=/${slug}/entregas/${id}`);
    }
  }, [status, slug, id, router]);

  const { data: delivery, isLoading } = useQuery({
    queryKey: ['delivery', id],
    queryFn: () => get<DeliveryDetail>(`/bff/api/delivery/${id}`),
    refetchInterval: 20000,
    enabled: status === 'authenticated' && user?.role === 'driver',
  });

  const pickUp = useMutation({
    mutationFn: () => patch(`/bff/api/delivery/${id}/pickup`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['delivery', id] }); toast.success('Coleta confirmada!'); },
    onError: () => toast.error('Erro ao confirmar coleta'),
  });

  const deliver = useMutation({
    mutationFn: () => patch(`/bff/api/delivery/${id}/deliver`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', id] });
      toast.success('Entrega confirmada!');
      setTimeout(() => router.push(`/${slug}/entregas`), 1500);
    },
    onError: () => toast.error('Erro ao confirmar entrega'),
  });

  if (status === 'loading' || status === 'unauthenticated' || user?.role !== 'driver') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" className="text-[var(--color-lime-primary)]" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" className="text-[var(--color-lime-primary)]" />
      </div>
    );
  }

  if (!delivery || isApiError(delivery)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-7 h-7 text-gray-300" />
        </div>
        <p className="font-bold text-gray-700 mb-2">Entrega não encontrada</p>
        <Link href={`/${slug}/entregas`} className="text-sm font-bold text-zinc-900 underline">Voltar</Link>
      </div>
    );
  }

  const { order } = delivery;
  const mapsUrl = order.address
    ? `https://maps.google.com/?q=${encodeURIComponent(`${order.address.street} ${order.address.number} ${order.address.neighborhood} ${order.address.city}`)}`
    : null;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href={`/${slug}/entregas`} className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="font-black text-gray-900 text-base leading-tight">
            Entrega #{order.id.slice(-4).toUpperCase()}
          </h1>
          <p className="text-xs text-gray-400 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <DeliveryCard
          delivery={delivery as unknown as Delivery}
          onPickUp={() => pickUp.mutate()}
          onDeliver={() => deliver.mutate()}
        />

        {/* Action buttons */}
        {delivery.status !== 'delivered' && (
          <div className="grid grid-cols-2 gap-3">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-zinc-900 text-zinc-900 font-bold text-sm hover:bg-zinc-900 hover:text-white transition-all"
              >
                <Navigation className="w-4 h-4" />
                Google Maps
              </a>
            )}
            {order.customer?.phone && (
              <a
                href={`tel:${order.customer.phone}`}
                className={`flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors ${!mapsUrl ? 'col-span-2' : ''}`}
              >
                <Phone className="w-4 h-4" />
                Ligar para cliente
              </a>
            )}
          </div>
        )}

        {delivery.status === 'delivered' && (
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-lg">Entregue com sucesso!</p>
              <p className="text-sm text-gray-400 mt-0.5">Esta entrega foi concluída</p>
            </div>
            <Link
              href={`/${slug}/entregas`}
              className="mt-1 px-6 py-3 rounded-xl bg-[var(--color-lime-primary)] text-white font-bold text-sm hover:brightness-90 transition-all"
            >
              Ver próximas entregas
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
