'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, isApiError } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { useSocket } from '@/hooks/use-socket'
import { Clock, ChevronRight } from 'lucide-react'
import OrderDetailModal from '@/components/admin/OrderDetailModal'
import { formatCurrency } from '@/lib/utils'
import useSessionStore from '@/store/session-store'

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

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export default function PedidosPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const queryClient = useQueryClient()
  const { tenant } = useSessionStore()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders-full'],
    queryFn: () => get<any[]>('/api/admin/orders'),
    refetchInterval: 15000,
  })

  useSocket(tenant?.id ? `admin:${tenant.id}` : undefined, {
    new_order: () => queryClient.invalidateQueries({ queryKey: ['admin-orders-full'] }),
    'order:update': () => queryClient.invalidateQueries({ queryKey: ['admin-orders-full'] }),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patch(`/api/admin/orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-full'] })
      toast.success('Pedido atualizado')
    },
    onError: () => toast.error('Erro ao atualizar pedido'),
  })

  const cancelOrder = useMutation({
    mutationFn: (id: string) => patch(`/api/admin/orders/${id}`, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-full'] })
      toast.success('Pedido cancelado')
    },
    onError: () => toast.error('Erro ao cancelar pedido'),
  })

  const refundOrder = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/orders/${id}/refund`, { method: 'POST' }).then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? 'Erro ao processar estorno')
        return data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-full'] })
      toast.success('Estorno processado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao processar estorno'),
  })

  const ordersArr = isApiError(orders) || !Array.isArray(orders) ? [] : orders
  const filtered = activeTab === 'all' ? ordersArr : ordersArr.filter((o: any) => o.status === activeTab)

  return (
    <div className="p-6 lg:p-8">
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
              <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
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
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="w-full text-left bg-white rounded-[28px] border border-black/5 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.99]"
            >
              {/* Status dot */}
              <div className={cn(
                'w-2.5 h-2.5 rounded-full shrink-0',
                order.status === 'pending' ? 'bg-gray-400 animate-pulse' :
                order.status === 'confirmed' ? 'bg-blue-500' :
                order.status === 'preparing' ? 'bg-yellow-500 animate-pulse' :
                order.status === 'ready' ? 'bg-orange-500' :
                order.status === 'delivered' ? 'bg-green-500' :
                'bg-red-400'
              )} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-black text-gray-900 text-sm">
                    #{order.id.slice(-8).toUpperCase()}
                  </span>
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'
                  )}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  {order.customerName && (
                    <span className="text-xs text-gray-400 truncate max-w-[120px]">
                      {order.customerName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                  <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                  <span className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs">{order.items?.length ?? 0} itens</span>
                  <span className="text-xs capitalize text-gray-400">{order.type}</span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      )}

      <OrderDetailModal
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onAdvance={(id, status) => updateStatus.mutate({ id, status })}
        onCancel={(id) => cancelOrder.mutate(id)}
        onRefund={(id) => refundOrder.mutate(id)}
        isAdvancing={updateStatus.isPending}
        isCancelling={cancelOrder.isPending}
        isRefunding={refundOrder.isPending}
      />
    </div>
  )
}
