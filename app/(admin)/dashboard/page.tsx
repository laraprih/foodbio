'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/api-client';
import MetricsCard from '@/components/admin/MetricsCard';
import OrderList from '@/components/admin/OrderList';
import { DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import useSessionStore from '@/store/session-store';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { tenant } = useSessionStore();

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['metrics', tenant?.id],
    queryFn: () => get<any>(`/bff/admin/metrics?tenantId=${tenant?.id}`),
    enabled: !!tenant?.id,
  });

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-orders', tenant?.id],
    queryFn: () => get<any>(`/bff/admin/orders?tenantId=${tenant?.id}`),
    enabled: !!tenant?.id,
    refetchInterval: 10_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patch<any>(`/bff/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      toast.success('Status atualizado');
    },
  });

  if (loadingMetrics || loadingOrders) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" className="text-[var(--color-lime-primary)]" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 font-medium">Bem-vindo, acompanhe o desempenho da sua loja.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Loja Aberta</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricsCard
          title="Faturamento"
          value={`R$ ${metrics?.totalRevenue?.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricsCard
          title="Pedidos"
          value={metrics?.orderCount || 0}
          icon={ShoppingBag}
          trend={{ value: 5, isPositive: true }}
        />
        <MetricsCard
          title="Ticket Médio"
          value={`R$ ${(metrics?.totalRevenue / (metrics?.orderCount || 1)).toFixed(2)}`}
          icon={TrendingUp}
        />
        <MetricsCard
          title="Novos Clientes"
          value={8}
          icon={Users}
          trend={{ value: 2, isPositive: false }}
        />
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Pedidos Recentes</h2>
          <button className="text-sm font-bold text-[var(--color-lime-primary)] hover:opacity-80">Ver todos</button>
        </div>
        <OrderList
          orders={orders || []}
          onStatusUpdate={(id, status) => updateStatusMutation.mutate({ id, status })}
          onViewDetails={(order) => console.log('View details', order)}
        />
      </div>
    </div>
  );
}
