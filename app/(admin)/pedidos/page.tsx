'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, isApiError } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { useSocket } from '@/hooks/use-socket'
import { Clock, CheckCircle, XCircle, Package, ChevronRight } from 'lucide-react'

const STATUS_TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'confirmed', label: 'Confirmados' },
  { id: 'preparing', label: 'Preparo' },
  { id: 'ready', label: 'Prontos' },
  { id: 'delivered', label: 'Entregues' },
  { id: 'cancelled', label: 'Cancelados' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
}

export default function PedidosPage() {
  const [activeTab, setActiveTab] = useState('all')
  const queryClient = useQueryClient()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders-full'],
    queryFn: () => get<any[]>('/bff/api/admin/orders'),
    refetchInterval: 15000,
  })

  // Live updates via Socket
  useSocket('admin', {
    new_order: () => queryClient.invalidateQueries({ queryKey: ['admin-orders-full'] }),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patch(`/bff/api/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-full'] })
      toast.success('Pedido atualizado')
    },
    onError: () => toast.error('Erro ao atualizar pedido'),
  })

  const cancelOrder = useMutation({
    mutationFn: (id: string) => patch(`/bff/api/admin/orders/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-full'] })
      toast.success('Pedido cancelado')
    },
  })

  const ordersArr = isApiError(orders) || !Array.isArray(orders) ? [] : orders
  const filtered = activeTab === 'all' ? ordersArr : ordersArr.filter((o: any) => o.status === activeTab)

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pedidos</h1>
          <p className="text-gray-500 font-medium">Gerencie e acompanhe todos os pedidos.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm font-bold text-sm text-gray-700">
          {ordersArr.length} pedidos hoje
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-[var(--color-lime-primary)] text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400'
            )}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className="ml-2 text-xs opacity-60">
                {ordersArr.filter((o: any) => o.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[28px] border border-black/5 p-6 flex items-start gap-4">
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3.5 w-12" />
                  <Skeleton className="h-3.5 w-10" />
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Skeleton className="h-9 w-24 rounded-2xl" />
                <Skeleton className="h-9 w-9 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 font-medium">
          Nenhum pedido nesta categoria.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order: any) => (
            <div
              key={order.id}
              className="bg-white rounded-[28px] border border-black/5 shadow-sm p-6 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-black text-gray-900">#{order.id.slice(-6)}</span>
                  <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full capitalize', STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600')}>
                    {order.status}
                  </span>
                  {order.type && (
                    <span className="text-xs text-gray-400 font-medium capitalize">{order.type}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span className="font-bold text-gray-900">{fmt(order.total)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>{order.items?.length ?? 0} itens</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {order.status !== 'delivered' && order.status !== 'cancelled' && NEXT_STATUS[order.status] && (
                  <button
                    onClick={() => updateStatus.mutate({ id: order.id, status: NEXT_STATUS[order.status] })}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[var(--color-lime-primary)] text-white font-bold text-xs hover:brightness-90 transition-all"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    Avançar
                  </button>
                )}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button
                    onClick={() => cancelOrder.mutate(order.id)}
                    className="w-9 h-9 rounded-xl border border-red-200 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
