'use client'

import React, { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch } from '@/lib/api-client'
import KDSCard from './KDSCard'
import Spinner from '@/components/ui/Spinner'
import { toast } from 'react-hot-toast'
import { useSocket } from '@/hooks/use-socket'
import { POLL, OrderStatus } from '@/lib/constants'
import type { Order } from '@/types'

interface KDSBoardProps {
  tenantId: string
}

const COLUMNS = [
  { id: OrderStatus.CONFIRMED, label: 'Novos Pedidos', nextStatus: OrderStatus.PREPARING, color: 'bg-blue-50 border-blue-200' },
  { id: OrderStatus.PREPARING, label: 'Em Preparo', nextStatus: OrderStatus.READY, color: 'bg-yellow-50 border-yellow-200' },
  { id: OrderStatus.READY, label: 'Prontos', nextStatus: null, color: 'bg-green-50 border-green-200' },
]

export default function KDSBoard({ tenantId }: KDSBoardProps) {
  const queryClient = useQueryClient()
  const audioRef = useRef<AudioContext | null>(null)
  const prevCountRef = useRef(0)

  const { connected } = useSocket(`kitchen:${tenantId}`, {
    new_order: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-orders', tenantId] })
      playAlert()
    },
  })

  const { data: rawOrders, isLoading } = useQuery({
    queryKey: ['kds-orders', tenantId],
    queryFn: () => get<Order[]>(`/bff/api/kitchen/orders`),
    refetchInterval: POLL.KDS,
  })
  const orders: Order[] = Array.isArray(rawOrders) ? rawOrders : []

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patch<any>(`/bff/api/kitchen/orders/${id}/${status === 'preparing' ? 'start' : 'ready'}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kds-orders', tenantId] }),
    onError: () => toast.error('Erro ao atualizar pedido'),
  })

  const cancelOrder = useMutation({
    mutationFn: (id: string) =>
      patch<any>(`/bff/api/admin/orders/${id}/status`, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-orders', tenantId] })
      toast.success('Pedido cancelado')
    },
  })

  // Sound alert on new orders
  useEffect(() => {
    const confirmed = orders.filter((o: any) => o.status === 'confirmed').length
    if (confirmed > prevCountRef.current) playAlert()
    prevCountRef.current = confirmed
  }, [orders])

  function playAlert() {
    try {
      const ctx = audioRef.current ?? new AudioContext()
      audioRef.current = ctx
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } catch {
      // AudioContext blocked by browser policy until user interaction — safe to ignore
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" className="text-[var(--color-lime-primary)]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="bg-zinc-900 text-white px-8 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight">KDS — Cozinha</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
            Kitchen Display System
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-500'}`} />
          <span className="text-xs font-bold text-zinc-400">{connected ? 'AO VIVO' : 'OFFLINE'}</span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-3 gap-6 p-6 overflow-hidden">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o: Order) => o.status === col.id)
          return (
            <div key={col.id} className="flex flex-col min-h-0">
              <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 mb-4 ${col.color}`}>
                <span className="font-black text-gray-800 text-sm">{col.label}</span>
                <span className="w-7 h-7 rounded-lg bg-white font-black text-gray-900 text-sm flex items-center justify-center shadow-sm">
                  {colOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {colOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm font-medium">
                    Nenhum pedido
                  </div>
                )}
                {colOrders.map((order: Order) => (
                  <KDSCard
                    key={order.id}
                    order={order}
                    onComplete={(id) =>
                      col.nextStatus
                        ? updateStatus.mutate({ id, status: col.nextStatus })
                        : undefined
                    }
                    onCancel={(id) => cancelOrder.mutate(id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
