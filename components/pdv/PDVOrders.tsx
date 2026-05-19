'use client'

import React, { useState, useMemo } from 'react'
import {
  ClipboardList, Search, Filter, Circle,
  Bike, Store, UtensilsCrossed, RefreshCw,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils'
import { PDVOrderDetail } from './PDVOrderDetail'
import type { PDVOrder, PDVMenuCategory, CashSession } from './types'

// ── status config ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  pending:    { label: 'Pendente',    dot: 'bg-gray-400',   text: 'text-gray-600',   bg: 'bg-gray-100' },
  confirmed:  { label: 'Confirmado', dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-100' },
  preparing:  { label: 'Preparando', dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-100' },
  ready:      { label: 'Pronto',     dot: 'bg-green-400',  text: 'text-green-700',  bg: 'bg-green-100' },
  dispatched: { label: 'Saiu',       dot: 'bg-indigo-400', text: 'text-indigo-700', bg: 'bg-indigo-100' },
  delivered:  { label: 'Entregue',   dot: 'bg-emerald-400',text: 'text-emerald-700',bg: 'bg-emerald-100' },
  cancelled:  { label: 'Cancelado',  dot: 'bg-red-400',    text: 'text-red-600',    bg: 'bg-red-100' },
}

const PAY_CFG: Record<string, { label: string; color: string }> = {
  pending:  { label: 'A pagar',  color: 'text-amber-600 bg-amber-50' },
  approved: { label: 'Pago',     color: 'text-emerald-600 bg-emerald-50' },
  failed:   { label: 'Falhou',   color: 'text-red-600 bg-red-50' },
  refunded: { label: 'Estornado',color: 'text-gray-500 bg-gray-100' },
}

const TYPE_ICON: Record<string, React.ElementType> = {
  delivery: Bike, pickup: Store, in_store: UtensilsCrossed,
}

const STATUS_FILTERS = [
  { key: 'all',        label: 'Todos' },
  { key: 'active',     label: 'Em aberto' },
  { key: 'pending',    label: 'Pendente' },
  { key: 'confirmed',  label: 'Confirmado' },
  { key: 'preparing',  label: 'Preparando' },
  { key: 'ready',      label: 'Pronto' },
  { key: 'delivered',  label: 'Entregue' },
  { key: 'cancelled',  label: 'Cancelado' },
] as const

// ── component ──────────────────────────────────────────────────────────────────

interface PDVOrdersProps {
  tenantName?: string
  menu?: PDVMenuCategory[]
  cashSession?: CashSession | null
}

export function PDVOrders({
  tenantName = '',
  menu = [],
  cashSession = null,
}: PDVOrdersProps) {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [originFilter, setOriginFilter] = useState<string>('all')
  const [search, setSearch]             = useState('')
  const [selectedId, setSelectedId]     = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery<{ orders: PDVOrder[] }>({
    queryKey: ['pdv-orders-today'],
    queryFn: () => fetch('/api/pdv/orders/today').then(r => r.json()),
    refetchInterval: 8_000,
  })

  const allOrders = data?.orders ?? []

  // ── stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active     = allOrders.filter(o => !['delivered','cancelled'].includes(o.status)).length
    const unpaid     = allOrders.filter(o => o.paymentStatus === 'pending' && o.status !== 'cancelled').length
    const totalToday = allOrders
      .filter(o => o.paymentStatus === 'approved')
      .reduce((s, o) => s + o.total, 0)
    return { active, unpaid, totalToday }
  }, [allOrders])

  // ── filter ───────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allOrders

    if (statusFilter === 'active') {
      list = list.filter(o => !['delivered','cancelled'].includes(o.status))
    } else if (statusFilter !== 'all') {
      list = list.filter(o => o.status === statusFilter)
    }

    if (originFilter !== 'all') list = list.filter(o => o.origin === originFilter)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        o.customerName?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        String(o.tableNumber ?? '').includes(q) ||
        o.customerPhone?.includes(q)
      )
    }

    return list
  }, [allOrders, statusFilter, originFilter, search])

  const selected = allOrders.find(o => o.id === selectedId) ?? null

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left panel: order list ── */}
      <div className={`flex flex-col ${selected ? 'w-[380px]' : 'flex-1'} border-r border-gray-100 shrink-0`}>

        {/* Header + stats */}
        <div className="px-5 py-4 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-black text-gray-900 text-lg leading-none">Pedidos de Hoje</h2>
              <p className="text-xs text-gray-500 mt-0.5">{allOrders.length} pedidos</p>
            </div>
            <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-blue-50 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-black text-blue-700">{stats.active}</p>
              <p className="text-[10px] text-blue-500 font-semibold">Em aberto</p>
            </div>
            <div className="bg-amber-50 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-black text-amber-700">{stats.unpaid}</p>
              <p className="text-[10px] text-amber-500 font-semibold">A pagar</p>
            </div>
            <div className="bg-emerald-50 rounded-xl px-3 py-2 text-center">
              <p className="text-sm font-black text-emerald-700">{formatCurrency(stats.totalToday)}</p>
              <p className="text-[10px] text-emerald-500 font-semibold">Faturado</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente, mesa, telefone…"
              className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 bg-gray-50"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                  statusFilter === f.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f.label}
                {f.key !== 'all' && f.key !== 'active' && (
                  <span className="ml-1 opacity-60">
                    {allOrders.filter(o => o.status === f.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Origin filter */}
          <div className="flex gap-1 mt-1.5">
            {[
              { key: 'all',    label: 'Todas origens' },
              { key: 'pdv',    label: 'PDV' },
              { key: 'online', label: 'Online' },
              { key: 'garcom', label: 'Garçom' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setOriginFilter(f.key)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                  originFilter === f.key
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1.5">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <ClipboardList className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs font-medium">Nenhum pedido encontrado</p>
            </div>
          ) : filtered.map(order => {
            const statusCfg  = STATUS_CFG[order.status] ?? STATUS_CFG.pending
            const payStatusCfg = PAY_CFG[order.paymentStatus] ?? PAY_CFG.pending
            const TypeIcon   = TYPE_ICON[order.type] ?? Store
            const time       = new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            const isSelected = selectedId === order.id

            return (
              <button
                key={order.id}
                onClick={() => setSelectedId(isSelected ? null : order.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                    : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                    <TypeIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-gray-400' : 'text-gray-400'}`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {order.customerName ?? 'Balcão'}
                      </p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>
                        {order.tableNumber ? `Mesa ${order.tableNumber} · ` : ''}
                        {time}
                        {order.origin === 'garcom' ? ' · Garçom' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(order.total)}
                    </p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : `${payStatusCfg.color}`
                    }`}>
                      {payStatusCfg.label}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right panel: order detail ── */}
      {selected ? (
        <div className="flex-1 overflow-hidden">
          <PDVOrderDetail
            key={selected.id}
            order={selected}
            tenantName={tenantName}
            menu={menu}
            cashSessionId={cashSession?.id ?? null}
            onClose={() => setSelectedId(null)}
            onRefresh={() => {
              qc.invalidateQueries({ queryKey: ['pdv-orders-today'] })
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
          <ClipboardList className="w-14 h-14 mb-3 opacity-30" />
          <p className="text-sm font-medium">Selecione um pedido</p>
          <p className="text-xs mt-1 opacity-60">para ver detalhes e ações</p>
        </div>
      )}
    </div>
  )
}
