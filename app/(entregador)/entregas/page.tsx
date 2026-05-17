'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { get, patch, isApiError } from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import DeliveryCard from '@/components/delivery/DeliveryCard';
import { useSocket } from '@/hooks/use-socket';
import { Package, CheckCircle2 } from 'lucide-react';

export default function EntregasPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.tenantId;

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: () => get<any[]>('/api/delivery'),
    refetchInterval: 8_000,
    refetchOnWindowFocus: true,
  });

  useSocket(tenantId ? `drivers:${tenantId}` : undefined, {
    new_delivery: () => queryClient.invalidateQueries({ queryKey: ['my-deliveries'] }),
    'order:update': () => queryClient.invalidateQueries({ queryKey: ['my-deliveries'] }),
  });

  const pickUp = useMutation({
    mutationFn: (id: string) => patch(`/api/delivery/${id}`, { action: 'pickup' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-deliveries'] }); toast.success('Coleta confirmada!'); },
    onError: () => toast.error('Erro ao confirmar coleta'),
  });

  const deliver = useMutation({
    mutationFn: (id: string) => patch(`/api/delivery/${id}`, { action: 'deliver' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-deliveries'] }); toast.success('Entrega confirmada!'); },
    onError: () => toast.error('Erro ao confirmar entrega'),
  });

  const deliveriesArr = isApiError(deliveries) || !Array.isArray(deliveries) ? [] : deliveries;
  const active = deliveriesArr.filter((d: any) => d.status !== 'delivered');
  const done = deliveriesArr.filter((d: any) => d.status === 'delivered');

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Minhas Entregas</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {active.length > 0 ? `${active.length} entrega${active.length !== 1 ? 's' : ''} ativa${active.length !== 1 ? 's' : ''}` : 'Nenhuma entrega ativa'}
          </p>
        </div>
        {active.length > 0 && (
          <span className="bg-[var(--color-lime-primary)] text-white text-sm font-black px-3 py-1 rounded-full">
            {active.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 flex-1 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : active.length === 0 && done.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-bold text-gray-600">Nenhuma entrega atribuída</p>
          <p className="text-gray-400 text-sm mt-1">Aguarde novas atribuições do sistema</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-4">
              {active.map((d: any) => (
                <DeliveryCard
                  key={d.id}
                  delivery={d}
                  onPickUp={() => pickUp.mutate(d.id)}
                  onDeliver={() => deliver.mutate(d.id)}
                />
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-gray-500">Concluídas hoje ({done.length})</h2>
              </div>
              <div className="space-y-3 opacity-60">
                {done.map((d: any) => (
                  <DeliveryCard key={d.id} delivery={d} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
