'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import KDSCard from './KDSCard'
import { toast } from 'react-hot-toast'
import { useSocket } from '@/hooks/use-socket'
import { POLL, OrderStatus } from '@/lib/constants'
import { Wifi, WifiOff, ChefHat } from 'lucide-react'
import type { Order } from '@/types'

interface KDSBoardProps {
  tenantId: string
}

type ColId = 'confirmed' | 'preparing' | 'ready'

const COLUMNS: { id: ColId; label: string; shortLabel: string; dot: string }[] = [
  { id: 'confirmed', label: 'Novos Pedidos', shortLabel: 'Novos',   dot: 'bg-blue-500' },
  { id: 'preparing', label: 'Em Preparo',    shortLabel: 'Preparo', dot: 'bg-amber-400' },
  { id: 'ready',     label: 'Prontos',       shortLabel: 'Prontos', dot: 'bg-emerald-400' },
]

export default function KDSBoard({ tenantId }: KDSBoardProps) {
  const queryClient = useQueryClient()
  const audioRef    = useRef<AudioContext | null>(null)
  const prevRef     = useRef(0)
  const [activeTab, setActiveTab] = useState<ColId>('confirmed')

  const { connected } = useSocket(`kitchen:${tenantId}`, {
    new_order: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-orders', tenantId] })
      setActiveTab('confirmed')
      playAlert()
    },
  })

  const { data: rawOrders, isLoading } = useQuery({
    queryKey: ['kds-orders', tenantId],
    queryFn: () =>
      fetch('/api/kitchen/orders')
        .then(r => r.json())
        .then(d => Array.isArray(d) ? d : []),
    refetchInterval: POLL.KDS,
  })
  const orders: Order[] = Array.isArray(rawOrders) ? rawOrders : []

  // Mutar status (confirmar → preparar → pronto)
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/kitchen/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(async r => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}))
          throw new Error(body.error ?? 'Erro ao atualizar')
        }
        return r.json()
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['kds-orders', tenantId] })
      // Avança a aba para o próximo estágio automaticamente
      if (vars.status === OrderStatus.PREPARING) setActiveTab('preparing')
      if (vars.status === OrderStatus.READY)     setActiveTab('ready')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const servedAtTable = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/kitchen/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dispatched' }),
      }).then(async r => {
        if (!r.ok) throw new Error('Erro ao marcar como servido')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-orders', tenantId] })
      toast.success('Mesa servida! 🍽️')
    },
    onError: () => toast.error('Erro ao marcar como servido'),
  })

  const cancelOrder = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/kitchen/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-orders', tenantId] })
      toast('Pedido cancelado', { icon: '🗑️' })
    },
  })

  // Som de alerta para novos pedidos
  useEffect(() => {
    const confirmed = orders.filter((o: any) => o.status === 'confirmed').length
    if (confirmed > prevRef.current) playAlert()
    prevRef.current = confirmed
  }, [orders])

  function playAlert() {
    try {
      const ctx = audioRef.current ?? new AudioContext()
      audioRef.current = ctx
      ;[0, 0.18, 0.36].forEach(t => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 1047
        gain.gain.setValueAtTime(0.4, ctx.currentTime + t)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15)
        osc.start(ctx.currentTime + t)
        osc.stop(ctx.currentTime + t + 0.15)
      })
    } catch { /* AudioContext bloqueado */ }
  }

  const colMap = Object.fromEntries(
    COLUMNS.map(c => [c.id, orders.filter((o: any) => o.status === c.id)])
  ) as Record<ColId, Order[]>

  const totalActive = orders.length

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white">

      {/* ── Topbar ──────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-lime-500 flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-sm leading-none">KDS Cozinha</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {totalActive} pedido{totalActive !== 1 ? 's' : ''} ativo{totalActive !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Contadores globais */}
          {COLUMNS.map(col => (
            <div key={col.id} className="hidden sm:flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className="text-xs font-bold text-zinc-400">
                {colMap[col.id]?.length ?? 0}
              </span>
            </div>
          ))}

          <div className="flex items-center gap-1.5 ml-3">
            {connected
              ? <Wifi className="w-4 h-4 text-emerald-400" />
              : <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />
            }
            <span className={`text-xs font-bold ${connected ? 'text-emerald-400' : 'text-red-500'}`}>
              {connected ? 'AO VIVO' : 'OFF'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Mobile: abas ─────────────────────────────────────────── */}
      <div className="shrink-0 flex lg:hidden border-b border-zinc-800 bg-zinc-900">
        {COLUMNS.map(col => {
          const count = colMap[col.id]?.length ?? 0
          const active = activeTab === col.id
          return (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors relative ${
                active ? 'text-white' : 'text-zinc-500'
              }`}
            >
              {active && (
                <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  col.id === 'confirmed' ? 'bg-blue-500' :
                  col.id === 'preparing' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
              )}
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${col.dot} text-white`}>
                {count}
              </span>
              {col.shortLabel}
            </button>
          )
        })}
      </div>

      {/* ── Grid desktop / Tab mobile ────────────────────────────── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Carregando pedidos…</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex">
          {/* Desktop: 3 colunas side-by-side */}
          <div className="hidden lg:grid lg:grid-cols-3 flex-1 gap-0 divide-x divide-zinc-800 overflow-hidden">
            {COLUMNS.map(col => (
              <KDSColumn
                key={col.id}
                col={col}
                orders={colMap[col.id] ?? []}
                updateStatus={updateStatus}
                servedAtTable={servedAtTable}
                cancelOrder={cancelOrder}
              />
            ))}
          </div>

          {/* Mobile/tablet: uma coluna de cada vez via aba */}
          <div className="lg:hidden flex-1 overflow-hidden">
            {COLUMNS.map(col => (
              <div key={col.id} className={`h-full ${activeTab === col.id ? 'flex flex-col' : 'hidden'}`}>
                <KDSColumn
                  col={col}
                  orders={colMap[col.id] ?? []}
                  updateStatus={updateStatus}
                  servedAtTable={servedAtTable}
                  cancelOrder={cancelOrder}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Coluna reutilizável ──────────────────────────────────────────
function KDSColumn({
  col,
  orders,
  updateStatus,
  servedAtTable,
  cancelOrder,
}: {
  col: { id: ColId; label: string; dot: string }
  orders: Order[]
  updateStatus: any
  servedAtTable: any
  cancelOrder: any
}) {
  const nextStatus: Record<ColId, string | null> = {
    confirmed: OrderStatus.PREPARING,
    preparing: OrderStatus.READY,
    ready: null,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Cabeçalho da coluna (visível só no desktop) */}
      <div className="hidden lg:flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
          <span className="font-bold text-sm text-zinc-200">{col.label}</span>
        </div>
        <span className={`text-xs font-black px-2 py-0.5 rounded-full text-white ${col.dot}`}>
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-zinc-700">
            <ChefHat className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhum pedido</p>
          </div>
        ) : (
          orders.map((order: Order) => {
            const next = nextStatus[col.id]
            return (
              <KDSCard
                key={order.id}
                order={order}
                column={col.id}
                onAdvance={(id) => next && updateStatus.mutate({ id, status: next })}
                onServedAtTable={(id) => servedAtTable.mutate(id)}
                onCancel={(id) => cancelOrder.mutate(id)}
                isPending={updateStatus.isPending || servedAtTable.isPending || cancelOrder.isPending}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
