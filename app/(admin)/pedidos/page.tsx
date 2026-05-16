'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, isApiError } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { useSocket } from '@/hooks/use-socket'
import { Clock, ChevronRight, CalendarDays, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react'
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

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function formatDisplay(iso: string) {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

const QUICK_OPTIONS = [
  { label: 'Hoje', getValue: () => { const t = toISO(new Date()); return { from: t, to: t } } },
  { label: 'Ontem', getValue: () => { const y = toISO(addDays(new Date(), -1)); return { from: y, to: y } } },
  { label: '7 dias', getValue: () => ({ from: toISO(addDays(new Date(), -6)), to: toISO(new Date()) }) },
  { label: '30 dias', getValue: () => ({ from: toISO(addDays(new Date(), -29)), to: toISO(new Date()) }) },
]

export default function PedidosPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const queryClient = useQueryClient()
  const { tenant } = useSessionStore()

  const todayISO = toISO(new Date())
  const [dateFrom, setDateFrom] = useState(todayISO)
  const [dateTo, setDateTo] = useState(todayISO)
  const [tempFrom, setTempFrom] = useState(todayISO)
  const [tempTo, setTempTo] = useState(todayISO)

  const activeQuick = QUICK_OPTIONS.findIndex((o) => {
    const v = o.getValue()
    return v.from === dateFrom && v.to === dateTo
  })

  function applyQuick(idx: number) {
    const v = QUICK_OPTIONS[idx].getValue()
    setDateFrom(v.from)
    setDateTo(v.to)
    setTempFrom(v.from)
    setTempTo(v.to)
    setShowDatePicker(false)
  }

  function applyCustom() {
    if (tempFrom > tempTo) {
      toast.error('Data inicial não pode ser maior que a final')
      return
    }
    setDateFrom(tempFrom)
    setDateTo(tempTo)
    setShowDatePicker(false)
  }

  function navigateDay(direction: -1 | 1) {
    const from = toISO(addDays(new Date(dateFrom + 'T12:00:00'), direction))
    const to   = toISO(addDays(new Date(dateTo   + 'T12:00:00'), direction))
    setDateFrom(from)
    setDateTo(to)
    setTempFrom(from)
    setTempTo(to)
  }

  const isSingleDay = dateFrom === dateTo

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders-full', dateFrom, dateTo],
    queryFn: () => get<any[]>(`/api/admin/orders?from=${dateFrom}&to=${dateTo}`),
    refetchInterval: 15000,
  })

  useSocket(tenant?.id ? `admin:${tenant.id}` : undefined, {
    new_order: () => queryClient.invalidateQueries({ queryKey: ['admin-orders-full', dateFrom, dateTo] }),
    'order:update': () => queryClient.invalidateQueries({ queryKey: ['admin-orders-full', dateFrom, dateTo] }),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patch(`/api/admin/orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-full', dateFrom, dateTo] })
      toast.success('Pedido atualizado')
    },
    onError: () => toast.error('Erro ao atualizar pedido'),
  })

  const cancelOrder = useMutation({
    mutationFn: (id: string) => patch(`/api/admin/orders/${id}`, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-full', dateFrom, dateTo] })
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
      queryClient.invalidateQueries({ queryKey: ['admin-orders-full', dateFrom, dateTo] })
      toast.success('Estorno processado com sucesso')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao processar estorno'),
  })

  const ordersArr = isApiError(orders) || !Array.isArray(orders) ? [] : orders
  const filtered = activeTab === 'all' ? ordersArr : ordersArr.filter((o: any) => o.status === activeTab)

  const dateLabel = isSingleDay
    ? (dateFrom === todayISO ? 'Hoje' : dateFrom === toISO(addDays(new Date(), -1)) ? 'Ontem' : formatDisplay(dateFrom))
    : `${formatDisplay(dateFrom)} – ${formatDisplay(dateTo)}`

  return (
    <div className="p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pedidos</h1>
          <p className="text-gray-500 font-medium">Gerencie e acompanhe todos os pedidos.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 shadow-sm rounded-2xl px-1 py-1">
          <span className="px-3 font-bold text-sm text-gray-700">{ordersArr.length} pedido{ordersArr.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Date filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5 relative">
        {/* Quick options */}
        {QUICK_OPTIONS.map((opt, idx) => (
          <button
            key={opt.label}
            onClick={() => applyQuick(idx)}
            className={cn(
              'px-4 py-2 rounded-2xl text-sm font-bold transition-colors whitespace-nowrap',
              activeQuick === idx
                ? 'bg-[var(--color-lime-primary)] text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400'
            )}
          >
            {opt.label}
          </button>
        ))}

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

        {/* Day navigator (only when single day selected) */}
        {isSingleDay && (
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => navigateDay(-1)}
              className="p-2 hover:bg-gray-50 transition-colors"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="px-2 text-sm font-bold text-gray-700 min-w-[70px] text-center">
              {dateLabel}
            </span>
            <button
              onClick={() => navigateDay(1)}
              disabled={dateFrom >= todayISO}
              className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-30"
              title="Próximo dia"
            >
              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* Custom date range toggle */}
        <button
          onClick={() => setShowDatePicker((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold border transition-colors whitespace-nowrap',
            showDatePicker || activeQuick === -1
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          )}
        >
          <CalendarDays className="w-4 h-4" />
          {activeQuick === -1 && !showDatePicker ? dateLabel : 'Personalizado'}
        </button>

        {/* Date picker dropdown */}
        {showDatePicker && (
          <div className="absolute top-full left-0 mt-2 z-30 bg-white border border-gray-100 rounded-2xl shadow-xl p-5 flex flex-col gap-4 min-w-[300px]">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Intervalo personalizado</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">De</label>
                <input
                  type="date"
                  value={tempFrom}
                  max={tempTo}
                  onChange={(e) => setTempFrom(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Até</label>
                <input
                  type="date"
                  value={tempTo}
                  min={tempFrom}
                  max={todayISO}
                  onChange={(e) => setTempTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowDatePicker(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={applyCustom}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-lime-primary)] text-white text-sm font-bold hover:brightness-90 transition-all"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status tabs */}
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

      {/* List */}
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
          Nenhum pedido encontrado para <span className="font-bold text-gray-600">{dateLabel}</span>.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order: any) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="w-full text-left bg-white rounded-[28px] border border-black/5 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.99]"
            >
              <div className={cn(
                'w-2.5 h-2.5 rounded-full shrink-0',
                order.status === 'pending'   ? 'bg-gray-400 animate-pulse' :
                order.status === 'confirmed' ? 'bg-blue-500' :
                order.status === 'preparing' ? 'bg-yellow-500 animate-pulse' :
                order.status === 'ready'     ? 'bg-orange-500' :
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
                    {new Date(order.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
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

      {/* Click outside to close date picker */}
      {showDatePicker && (
        <div className="fixed inset-0 z-20" onClick={() => setShowDatePicker(false)} />
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
