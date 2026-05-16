'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/api-client';
import KDSCard from '@/components/kitchen/KDSCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'react-hot-toast';
import { useSocket } from '@/hooks/use-socket';

export default function KDSBoard() {
  const queryClient = useQueryClient();
  const { connected } = useSocket('kds');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['kds-orders'],
    queryFn: () => get<any>('/api/admin/orders'),
    refetchInterval: 5000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patch<any>(`/api/admin/orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
      toast.success('Pedido atualizado');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-zinc-100">
        <div className="bg-zinc-900 px-8 py-6 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44 bg-zinc-700" />
            <Skeleton className="h-3 w-56 bg-zinc-700" />
          </div>
          <Skeleton className="w-12 h-12 rounded-2xl bg-zinc-700" />
        </div>
        <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const ordersArr = Array.isArray(orders) ? orders : [];
  const preparingOrders = ordersArr.filter((o: any) => o.status === 'preparing');
  const incomingOrders = ordersArr.filter((o: any) => o.status === 'confirmed');

  return (
    <div className="flex flex-col h-screen bg-zinc-100">
      <header className="bg-zinc-900 text-white px-8 py-6 flex items-center justify-between shadow-lg">
        <div>
          <h1 className="text-2xl font-black tracking-tighter">COZINHA BOARD</h1>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1">Real-time Order Management</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Conexão</p>
            <p className={`text-xs font-black ${connected ? 'text-green-500' : 'text-red-500'}`}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </p>
          </div>
          <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center font-black text-xl">
            {ordersArr.length}
          </div>
        </div>
      </header>

      <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 overflow-y-auto no-scrollbar">
        {/* Em Preparo First */}
        {preparingOrders.map((order: any) => (
          <KDSCard
            key={order.id}
            order={order}
            onComplete={(id) => updateStatus.mutate({ id, status: 'ready' })}
            onCancel={(id) => updateStatus.mutate({ id, status: 'cancelled' })}
          />
        ))}
        {/* Then Incoming */}
        {incomingOrders.map((order: any) => (
          <KDSCard
            key={order.id}
            order={order}
            onComplete={(id) => updateStatus.mutate({ id, status: 'preparing' })}
            onCancel={(id) => updateStatus.mutate({ id, status: 'cancelled' })}
          />
        ))}
      </div>
    </div>
  );
}
