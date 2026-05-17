'use client'

import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { get, patch } from '@/lib/api-client'
import { useSocket } from '@/hooks/use-socket'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import {
  Wifi, WifiOff, ChefHat, Clock, Printer,
  CheckCircle, Package, Bell, Flame,
  AlertTriangle, Truck, Store, RefreshCw,
} from 'lucide-react'

// ── helpers ──────────────────────────────────────────────────────────────────

function elapsed(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
}

function useNow() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

// ── columns config (cores compatíveis com admin) ──────────────────────────────

const COLUMNS = [
  {
    id: 'confirmed',
    label: 'Novos',
    Icon: Bell,
    cardBorder: 'border-l-blue-500',
    headerBg: 'bg-blue-50',
    headerText: 'text-blue-700',
    badgeBg: 'bg-blue-100 text-blue-700',
    countBg: 'bg-blue-500',
    actionBg: 'bg-blue-600 hover:bg-blue-700',
    timerAlert: 'text-amber-600 bg-amber-50',
    nextStatus: 'preparing',
    actionLabel: 'Iniciar Preparo',
    ActionIcon: Flame,
  },
  {
    id: 'preparing',
    label: 'Em Preparo',
    Icon: ChefHat,
    cardBorder: 'border-l-yellow-500',
    headerBg: 'bg-yellow-50',
    headerText: 'text-yellow-700',
    badgeBg: 'bg-yellow-100 text-yellow-700',
    countBg: 'bg-yellow-500',
    actionBg: 'bg-[var(--color-lime-primary)] hover:brightness-90',
    timerAlert: 'text-red-600 bg-red-50',
    nextStatus: 'ready',
    actionLabel: 'Marcar Pronto',
    ActionIcon: CheckCircle,
  },
  {
    id: 'ready',
    label: 'Prontos',
    Icon: Package,
    cardBorder: 'border-l-green-500',
    headerBg: 'bg-green-50',
    headerText: 'text-green-700',
    badgeBg: 'bg-green-100 text-green-700',
    countBg: 'bg-green-500',
    actionBg: 'bg-green-600 hover:bg-green-700',
    timerAlert: 'text-red-600 bg-red-50',
    nextStatus: 'dispatched',
    actionLabel: 'Entregar',
    ActionIcon: Truck,
  },
] as const

type ColConfig = typeof COLUMNS[number]

// ── print ticket ─────────────────────────────────────────────────────────────

function printTicket(order: any, tenantName?: string) {
  const addr = order.deliveryAddress
    ? typeof order.deliveryAddress === 'string'
      ? (() => { try { return JSON.parse(order.deliveryAddress) } catch { return null } })()
      : order.deliveryAddress
    : null

  const date   = new Date(order.createdAt)
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const num    = order.id.slice(-8).toUpperCase()

  const rows = (order.items ?? []).map((it: any) =>
    `<tr>
      <td style="font-weight:900;font-size:20px;padding:3px 10px 3px 0;width:32px">${it.quantity}x</td>
      <td style="font-size:15px;font-weight:600;padding:3px 0">${it.product?.name ?? it.name ?? '—'}</td>
    </tr>`
  ).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Pedido #${num}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;width:80mm;margin:0 auto;padding:6mm 4mm;color:#000;background:#fff}
.hr{border:none;border-top:1px dashed #bbb;margin:8px 0}
.hrs{border:none;border-top:2px solid #000;margin:8px 0}
.c{text-align:center}.b{font-weight:900}
table{width:100%;border-collapse:collapse}
@media print{body{margin:0}}
</style></head><body>
<div class="c" style="margin-bottom:6px">
  <div class="b" style="font-size:20px">${tenantName ?? 'RESTAURANTE'}</div>
  <div style="font-size:11px">${dateStr} às ${timeStr}</div>
</div>
<div class="hrs"/>
<div class="c" style="margin:8px 0">
  <div style="font-size:11px;font-weight:700;letter-spacing:1px">PEDIDO</div>
  <div class="b" style="font-size:28px">#${num}</div>
</div>
<div class="hr"/>
<div class="c" style="margin:6px 0">
  <span style="border:2px solid #000;border-radius:4px;padding:2px 10px;font-weight:900;font-size:13px">
    ${order.type === 'delivery' ? '🛵 DELIVERY' : '🏪 RETIRADA NO BALCÃO'}
  </span>
</div>
<div class="hr"/>
<div class="b" style="margin-bottom:4px;font-size:13px">ITENS:</div>
<table>${rows}</table>
<div class="hr"/>
<table style="margin-bottom:4px">
  ${(order.deliveryFee ?? 0) > 0
    ? `<tr><td style="font-size:12px">Taxa entrega:</td><td style="text-align:right;font-size:12px">${formatCurrency(order.deliveryFee)}</td></tr>`
    : ''}
  <tr>
    <td class="b" style="font-size:15px">TOTAL:</td>
    <td class="b" style="text-align:right;font-size:15px">${formatCurrency(order.total)}</td>
  </tr>
</table>
<div class="hrs"/>
<div class="b" style="font-size:13px;margin-bottom:3px">CLIENTE:</div>
<div style="font-size:14px">${order.customerName ?? '—'}</div>
${order.customerPhone ? `<div style="font-size:12px">${order.customerPhone}</div>` : ''}
${addr ? `
<div class="hr"/>
<div class="b" style="font-size:13px;margin-bottom:3px">ENDEREÇO:</div>
<div style="font-size:13px">${addr.street}, ${addr.number}${addr.complement ? ` — ${addr.complement}` : ''}</div>
<div style="font-size:12px">${addr.neighborhood}${addr.city ? ` · ${addr.city}/${addr.state}` : ''}</div>
${addr.cep ? `<div style="font-size:11px">CEP ${addr.cep}</div>` : ''}
` : ''}
<div class="hrs"/>
<div class="c b" style="font-size:13px;letter-spacing:2px">★ PARA O ENTREGADOR ★</div>
<div class="c" style="font-size:11px;margin-top:3px">Verifique os itens antes de sair</div>
</body></html>`

  const win = window.open('', '_blank', 'width=420,height=620')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({
  order, col, onAction, onCancel, tenantName,
}: {
  order: any
  col: ColConfig
  onAction: (id: string, status: string) => void
  onCancel: (id: string) => void
  tenantName?: string
}) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60000)
    return () => clearInterval(t)
  }, [])

  const min    = elapsed(order.createdAt)
  const isLate = min >= 20

  // "Prontos" column: action depends on order type
  const isReadyCol = col.id === 'ready'
  const actionNextStatus: string = isReadyCol
    ? (order.type === 'delivery' ? 'dispatched' : 'delivered')
    : col.nextStatus
  const actionLabel = isReadyCol
    ? (order.type === 'delivery' ? 'Saiu pra entrega' : 'Confirmar Retirada')
    : col.actionLabel
  const ActionIcon = isReadyCol
    ? (order.type === 'delivery' ? Truck : Store)
    : col.ActionIcon

  const addr   = order.deliveryAddress
    ? typeof order.deliveryAddress === 'string'
      ? (() => { try { return JSON.parse(order.deliveryAddress) } catch { return null } })()
      : order.deliveryAddress
    : null

  return (
    <div className={cn(
      'bg-white rounded-2xl border border-gray-100 border-l-4 shadow-sm flex flex-col overflow-hidden',
      col.cardBorder,
      isLate && 'ring-2 ring-red-200'
    )}>
      {/* Header */}
      <div className={cn('flex items-center justify-between px-4 py-2.5', col.headerBg)}>
        <div className="flex items-center gap-2">
          <span className="font-black text-gray-900 text-base tracking-tight">
            #{order.id.slice(-6).toUpperCase()}
          </span>
          {isLate && <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tipo */}
          <span className={cn(
            'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
            order.type === 'delivery'
              ? 'bg-[var(--color-lime-primary)]/10 text-[var(--color-lime-primary)]'
              : 'bg-gray-100 text-gray-600'
          )}>
            {order.type === 'delivery'
              ? <><Truck className="w-2.5 h-2.5" />Delivery</>
              : <><Store className="w-2.5 h-2.5" />Balcão</>}
          </span>

          {/* Timer */}
          <span className={cn(
            'flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full',
            isLate ? col.timerAlert : 'bg-gray-100 text-gray-500'
          )}>
            <Clock className="w-2.5 h-2.5" />
            {min}min
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 pt-3 pb-2 space-y-3">
        {/* Cliente */}
        {order.customerName && (
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Cliente</p>
            <p className="text-sm font-bold text-gray-900 leading-tight truncate">{order.customerName}</p>
            {order.customerPhone && (
              <p className="text-[11px] text-gray-400">{order.customerPhone}</p>
            )}
          </div>
        )}

        {/* Endereço (delivery) */}
        {addr && (
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Endereço</p>
            <p className="text-xs text-gray-700 leading-tight">{addr.street}, {addr.number}</p>
            <p className="text-[11px] text-gray-400">{addr.neighborhood}{addr.city ? ` — ${addr.city}` : ''}</p>
          </div>
        )}

        {/* Itens */}
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Itens ({(order.items ?? []).length})
          </p>
          <div className="space-y-1.5">
            {(order.items ?? []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm shrink-0 text-white"
                  style={{ backgroundColor: 'var(--color-lime-primary)' }}>
                  {item.quantity}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-bold text-gray-800 leading-tight">
                    {item.product?.name ?? item.name ?? '—'}
                  </p>
                  {(item.options ?? []).map((o: any, oi: number) => (
                    <p key={oi} className="text-[10px] text-gray-400">+ {o.name}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: total + print */}
      <div className="flex items-center justify-between px-4 pb-2 pt-1 border-t border-gray-50">
        <span className="text-sm font-black text-gray-800">{formatCurrency(order.total ?? 0)}</span>
        <button
          onClick={() => printTicket(order, tenantName)}
          className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-[var(--color-lime-primary)] transition-colors py-1 px-2 rounded-lg hover:bg-[var(--color-lime-primary)]/5"
        >
          <Printer className="w-3.5 h-3.5" />
          Imprimir
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-5 gap-2 px-3 pb-3">
        <button
          onClick={() => onCancel(order.id)}
          className="col-span-1 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-xs font-bold hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          ✕
        </button>
        <button
          onClick={() => onAction(order.id, actionNextStatus)}
          className={cn(
            'col-span-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 flex items-center justify-center gap-2',
            col.actionBg
          )}
        >
          <ActionIcon className="w-4 h-4" />
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function KDSBoard() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const now       = useNow()
  const tenantId  = (session?.user as any)?.tenantId
  const tenantName = (session?.user as any)?.tenantName

  // Mobile: active tab
  const [activeTab, setActiveTab] = useState(0)

  const { connected } = useSocket(
    tenantId ? `kitchen:${tenantId}` : undefined,
    {
      new_order:    () => queryClient.invalidateQueries({ queryKey: ['kds-orders'] }),
      'order:update': () => queryClient.invalidateQueries({ queryKey: ['kds-orders'] }),
    }
  )

  const { data: orders, isLoading, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['kds-orders'],
    queryFn: () => get<any>('/api/admin/orders'),
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patch<any>(`/api/admin/orders/${id}`, { status }),
    // Optimistic update: moves the card immediately in the UI
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['kds-orders'] })
      const prev = queryClient.getQueryData(['kds-orders'])
      queryClient.setQueryData(['kds-orders'], (old: any) =>
        Array.isArray(old) ? old.map(o => o.id === id ? { ...o, status } : o) : old
      )
      return { prev }
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['kds-orders'], ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['kds-orders'] }),
  })

  const arr: any[]   = Array.isArray(orders) ? orders : []
  const colData      = [
    arr.filter(o => o.status === 'confirmed'),
    arr.filter(o => o.status === 'preparing'),
    arr.filter(o => o.status === 'ready'),
  ]
  const total = colData.reduce((s, c) => s + c.length, 0)

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  const cardProps = (col: ColConfig) => ({
    col,
    tenantName,
    onAction: (id: string, status: string) => updateStatus.mutate({ id, status }),
    onCancel: (id: string) => updateStatus.mutate({ id, status: 'cancelled' }),
  })

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Brand */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--color-lime-primary)' }}>
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-gray-900 text-sm leading-none">Cozinha</h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Kitchen Display</p>
          </div>

          {/* Counts — hidden on very small */}
          <div className="hidden sm:flex items-center gap-2 ml-2">
            {COLUMNS.map((col, idx) => (
              <span key={col.id} className={cn('text-xs font-bold px-2.5 py-1 rounded-full', col.badgeBg)}>
                <col.Icon className="w-3 h-3 inline mr-1" />{colData[idx].length}
              </span>
            ))}
          </div>

          {/* Right: clock + refresh + connection */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {/* Refresh */}
            <button
              onClick={() => refetch()}
              className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              <RefreshCw className="w-3 h-3" />
              {lastUpdate}
            </button>

            {/* Clock */}
            <span className="hidden md:block text-sm font-black text-gray-700 tabular-nums">
              {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>

            {/* Connection */}
            <span className={cn(
              'flex items-center gap-1 text-[10px] font-black px-2.5 py-1.5 rounded-xl border',
              connected
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-600'
            )}>
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden sm:inline">{connected ? 'Online' : 'Offline'}</span>
            </span>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="flex border-t border-gray-100 lg:hidden">
          {COLUMNS.map((col, idx) => (
            <button
              key={col.id}
              onClick={() => setActiveTab(idx)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors border-b-2',
                activeTab === idx
                  ? `border-[var(--color-lime-primary)] text-[var(--color-lime-primary)]`
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              <col.Icon className="w-3.5 h-3.5" />
              {col.label}
              {colData[idx].length > 0 && (
                <span className={cn('text-[10px] font-black px-1.5 py-0.5 rounded-full text-white', col.countBg)}>
                  {colData[idx].length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--color-lime-primary)', borderTopColor: 'transparent' }} />
            <p className="text-gray-400 text-sm font-bold">Carregando pedidos…</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Desktop: 3 columns ── */}
          <div className="hidden lg:grid lg:grid-cols-3 flex-1 min-h-0 gap-0 overflow-hidden">
            {COLUMNS.map((col, idx) => (
              <div key={col.id} className={cn(
                'flex flex-col overflow-hidden',
                idx < 2 && 'border-r border-gray-200'
              )}>
                {/* Column header */}
                <div className={cn('flex items-center gap-2 px-4 py-2.5 border-b border-gray-100', col.headerBg)}>
                  <col.Icon className={cn('w-4 h-4', col.headerText)} />
                  <span className={cn('text-xs font-black uppercase tracking-wider', col.headerText)}>
                    {col.label}
                  </span>
                  <span className={cn('ml-auto text-xs font-black text-white w-5 h-5 rounded-full flex items-center justify-center', col.countBg)}>
                    {colData[idx].length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
                  {colData[idx].length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 opacity-40">
                      <col.Icon className={cn('w-10 h-10 mb-2', col.headerText)} />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nenhum pedido</p>
                    </div>
                  ) : (
                    colData[idx].map((order: any) => (
                      <OrderCard key={order.id} order={order} {...cardProps(col)} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Tablet: 2 columns (first 2 cols + ready below) ── */}
          <div className="hidden md:flex lg:hidden flex-1 min-h-0 flex-col overflow-hidden">
            {/* Top row: novos + em preparo */}
            <div className="grid grid-cols-2 flex-1 min-h-0 border-b border-gray-200 overflow-hidden">
              {COLUMNS.slice(0, 2).map((col, idx) => (
                <div key={col.id} className={cn(
                  'flex flex-col overflow-hidden',
                  idx === 0 && 'border-r border-gray-200'
                )}>
                  <div className={cn('flex items-center gap-2 px-3 py-2 border-b border-gray-100', col.headerBg)}>
                    <col.Icon className={cn('w-3.5 h-3.5', col.headerText)} />
                    <span className={cn('text-xs font-black uppercase tracking-wider', col.headerText)}>{col.label}</span>
                    <span className={cn('ml-auto text-xs font-black text-white w-5 h-5 rounded-full flex items-center justify-center', col.countBg)}>
                      {colData[idx].length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
                    {colData[idx].length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-8 opacity-40">
                        <col.Icon className={cn('w-8 h-8 mb-2', col.headerText)} />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nenhum pedido</p>
                      </div>
                    ) : (
                      colData[idx].map((order: any) => (
                        <OrderCard key={order.id} order={order} {...cardProps(col)} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom row: prontos (horizontal scroll) */}
            {(() => {
              const readyCol = COLUMNS[2]
              const ReadyIcon = readyCol.Icon
              return (
                <div className="shrink-0 max-h-[40%] flex flex-col overflow-hidden">
                  <div className={cn('flex items-center gap-2 px-3 py-2 border-b border-gray-100', readyCol.headerBg)}>
                    <ReadyIcon className={cn('w-3.5 h-3.5', readyCol.headerText)} />
                    <span className={cn('text-xs font-black uppercase tracking-wider', readyCol.headerText)}>{readyCol.label}</span>
                    <span className={cn('ml-auto text-xs font-black text-white w-5 h-5 rounded-full flex items-center justify-center', readyCol.countBg)}>
                      {colData[2].length}
                    </span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar p-3">
                    {colData[2].length === 0 ? (
                      <div className="flex-1 flex items-center justify-center py-6 opacity-40">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nenhum pedido pronto</p>
                      </div>
                    ) : (
                      colData[2].map((order: any) => (
                        <div key={order.id} className="w-72 shrink-0">
                          <OrderCard order={order} {...cardProps(readyCol)} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* ── Mobile: tab panels ── */}
          <div className="flex md:hidden flex-1 min-h-0 overflow-hidden">
            {COLUMNS.map((col, idx) => (
              <div
                key={col.id}
                className={cn(
                  'absolute inset-0 top-auto flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 transition-opacity',
                  activeTab === idx ? 'block' : 'hidden'
                )}
                style={{ top: 0, position: 'relative' }}
              >
                {colData[idx].length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 opacity-40">
                    <col.Icon className={cn('w-12 h-12 mb-3', col.headerText)} />
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Nenhum pedido</p>
                    <p className="text-xs text-gray-400 mt-1">{col.label}</p>
                  </div>
                ) : (
                  colData[idx].map((order: any) => (
                    <OrderCard key={order.id} order={order} {...cardProps(col)} />
                  ))
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state global */}
      {!isLoading && total === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none" style={{ top: '120px' }}>
          <ChefHat className="w-20 h-20 text-gray-200 mx-auto mb-3" />
          <p className="text-lg font-black text-gray-200 uppercase tracking-widest">Aguardando pedidos</p>
        </div>
      )}
    </div>
  )
}
