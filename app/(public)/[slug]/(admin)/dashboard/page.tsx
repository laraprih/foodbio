'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/api-client';
import MetricsCard from '@/components/admin/MetricsCard';
import OrderList from '@/components/admin/OrderList';
import { DollarSign, ShoppingBag, TrendingUp, Users, RefreshCw, Store } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { POLL } from '@/lib/constants';
import type { Order, Metrics } from '@/types';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => get<Metrics>('/api/admin/reports/summary'),
  });

  const { data: orders, isLoading: loadingOrders, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => get<Order[]>('/api/admin/orders'),
    refetchInterval: POLL.DASHBOARD,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patch<Order>(`/api/admin/orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      toast.success('Status atualizado');
    },
  });

  const safeMetrics = metrics && !('error' in metrics) ? metrics : null;
  const safeOrders: Order[] = Array.isArray(orders) ? orders : [];
  const pendingCount = safeOrders.filter((o) => o.status === 'pending').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard</h1>
            {pendingCount > 0 && (
              <span className="bg-[var(--color-lime-primary)] text-white text-xs font-black px-2.5 py-1 rounded-full">
                {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">Acompanhe o desempenho em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">Loja Aberta</span>
          </div>
        </div>
      </div>

      {loadingMetrics || loadingOrders ? (
        <>
          {/* Metric cards skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="w-10 h-10 rounded-xl" />
                </div>
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
          {/* Status pills skeleton */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 text-center space-y-2">
                <Skeleton className="h-6 w-8 mx-auto" />
                <Skeleton className="h-2.5 w-14 mx-auto" />
              </div>
            ))}
          </div>
          {/* Order rows skeleton */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricsCard
              title="Faturamento"
              value={formatCurrency(safeMetrics?.totalRevenue ?? 0)}
              icon={DollarSign}
              description="total acumulado"
            />
            <MetricsCard
              title="Pedidos"
              value={safeMetrics?.orderCount ?? 0}
              icon={ShoppingBag}
              description="total acumulado"
            />
            <MetricsCard
              title="Ticket Médio"
              value={formatCurrency(
                safeMetrics ? (safeMetrics.totalRevenue ?? 0) / (safeMetrics.orderCount || 1) : 0
              )}
              icon={TrendingUp}
              description="por pedido"
            />
            <MetricsCard
              title="Clientes"
              value={safeMetrics?.newCustomers ?? 0}
              icon={Users}
              description="novos hoje"
            />
          </div>

          {/* Quick status bar */}
          {safeOrders.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
              {(['pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'delivered'] as const).map((s) => {
                const count = safeOrders.filter((o) => o.status === s).length;
                const labels: Record<string, string> = {
                  pending: 'Aguardando', confirmed: 'Confirmado', preparing: 'Preparando',
                  ready: 'Pronto', dispatched: 'Enviado', delivered: 'Entregue',
                };
                return (
                  <div key={s} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                    <p className="text-xl font-black text-gray-900">{count}</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wide leading-tight">{labels[s]}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Orders table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">Pedidos Recentes</h2>
              <button className="text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5">
                <Store className="w-4 h-4" />
                Ver todos
              </button>
            </div>
            <OrderList
              orders={safeOrders}
              onStatusUpdate={(id, status) => updateStatusMutation.mutate({ id, status })}
              onViewDetails={() => {}}
            />
          </div>
        </>
      )}
    </div>
  );
}
