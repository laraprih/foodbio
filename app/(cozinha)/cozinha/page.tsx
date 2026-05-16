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
  CheckCircle, Package, Bell, Flame, AlertTriangle,
  Truck, Store, RefreshCw,
} from 'lucide-react'

// ── helpers ──────────────────────────────────────────────────────────────────

function elapsed(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
}

function timerColor(min: number): string {
  if (min < 10) return 'text-emerald-400'
  if (min < 20) return 'text-amber-400'
  return 'text-red-400'
}

function timerBg(min: number): string {
  if (min < 10) return 'bg-emerald-400/10 border-emerald-400/30'
  if (min < 20) return 'bg-amber-400/10 border-amber-400/30'
  return 'bg-red-400/10 border-red-400/30 animate-pulse'
}

function useNow() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  return now
}

// ── print ticket ─────────────────────────────────────────────────────────────

function printTicket(order: any, tenantName?: string) {
  const addr = order.deliveryAddress
    ? typeof order.deliveryAddress === 'string'
      ? (() => { try { return JSON.parse(order.deliveryAddress) } catch { return null } })()
      : order.deliveryAddress
    : null

  const date = new Date(order.createdAt)
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const orderNum = order.id.slice(-8).toUpperCase()

  const itemsHTML = (order.items ?? []).map((it: any) =>
    `<tr>
      <td style="font-weight:900;font-size:18px;padding-right:12px;width:30px">${it.quantity}x</td>
      <td style="font-size:15px;font-weight:600">${it.product?.name ?? it.name ?? '—'}</td>
    </tr>`
  ).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Pedido #${orderNum}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 6mm 4mm; color: #000; background: #fff; }
  .divider { border:none; border-top: 1px dashed #999; margin: 8px 0; }
  .divider-solid { border:none; border-top: 2px solid #000; margin: 8px 0; }
  .center { text-align: center; }
  .bold { font-weight: 900; }
  .big { font-size: 22px; }
  .med { font-size: 14px; }
  .sm { font-size: 11px; }
  .tag { display:inline-block; border: 2px solid #000; border-radius:4px; padding: 2px 8px; font-weight:900; font-size:13px; }
  table { width:100%; border-collapse: collapse; }
  @media print { body { margin:0; } }
</style>
</head>
<body>
  <div class="center" style="margin-bottom:6px">
    <div class="bold" style="font-size:20px">${tenantName ?? 'RESTAURANTE'}</div>
    <div class="sm">${dateStr} às ${timeStr}</div>
  </div>

  <hr class="divider-solid"/>

  <div class="center" style="margin:8px 0">
    <div style="font-size:13px;font-weight:700;letter-spacing:1px">PEDIDO</div>
    <div class="bold big">#${orderNum}</div>
  </div>

  <hr class="divider"/>

  <div class="center" style="margin:6px 0">
    <span class="tag">${order.type === 'delivery' ? '🛵 DELIVERY' : '🏪 RETIRADA NO BALCÃO'}</span>
  </div>

  <hr class="divider"/>

  <div class="bold med" style="margin-bottom:4px">ITENS:</div>
  <table>
    ${itemsHTML}
  </table>

  <hr class="divider"/>

  <table style="margin-bottom:4px">
    ${order.deliveryFee > 0 ? `<tr><td class="sm">Taxa de entrega:</td><td class="sm" style="text-align:right">${formatCurrency(order.deliveryFee)}</td></tr>` : ''}
    <tr>
      <td class="bold med">TOTAL:</td>
      <td class="bold med" style="text-align:right">${formatCurrency(order.total)}</td>
    </tr>
  </table>

  <hr class="divider-solid"/>

  <div class="bold med" style="margin-bottom:4px">CLIENTE:</div>
  <div class="med">${order.customerName ?? '—'}</div>
  ${order.customerPhone ? `<div class="sm">${order.customerPhone}</div>` : ''}

  ${addr ? `
  <hr class="divider"/>
  <div class="bold med" style="margin-bottom:4px">ENDEREÇO DE ENTREGA:</div>
  <div class="med">${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}</div>
  <div class="sm">${addr.neighborhood}${addr.city ? ` — ${addr.city}/${addr.state}` : ''}</div>
  ${addr.cep ? `<div class="sm">CEP: ${addr.cep}</div>` : ''}
  ` : ''}

  <hr class="divider-solid"/>

  <div class="center" style="margin-top:6px">
    <div class="bold" style="font-size:13px;letter-spacing:2px">★ PARA O ENTREGADOR ★</div>
    <div class="sm" style="margin-top:4px">Verifique os itens antes de sair</div>
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=400,height=600')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

// ── column config ─────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    id: 'confirmed',
    label: 'NOVOS',
    Icon: Bell,
    accent: '#f59e0b',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/40',
    headerBg: 'bg-amber-500/20',
    dot: 'bg-amber-400',
    action: { label: 'Iniciar Preparo', nextStatus: 'preparing', Icon: Flame },
  },
  {
    id: 'preparing',
    label: 'EM PREPARO',
    Icon: ChefHat,
    accent: '#3b82f6',
    bg: 'bg-blue-950/40',
    border: 'border-blue-500/40',
    headerBg: 'bg-blue-500/20',
    dot: 'bg-blue-400',
    action: { label: 'Marcar Pronto', nextStatus: 'ready', Icon: CheckCircle },
  },
  {
    id: 'ready',
    label: 'PRONTOS',
    Icon: Package,
    accent: '#22c55e',
    bg: 'bg-green-950/40',
    border: 'border-green-500/40',
    headerBg: 'bg-green-500/20',
    dot: 'bg-green-400',
    action: { label: 'Entregar', nextStatus: 'dispatched', Icon: Truck },
  },
]

// ── KDS Card ──────────────────────────────────────────────────────────────────

function KDSCard({
  order, column, onAction, onCancel, tenantName,
}: {
  order: any
  column: typeof COLUMNS[0]
  onAction: (id: string, status: string) => void
  onCancel: (id: string) => void
  tenantName?: string
}) {
  const [, forceRender] = useState(0)
  useEffect(() => {
    const t = setInterval(() => forceRender(n => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const min = elapsed(order.createdAt)
  const isLate = min >= 20
  const addr = order.deliveryAddress
    ? typeof order.deliveryAddress === 'string'
      ? (() => { try { return JSON.parse(order.deliveryAddress) } catch { return null } })()
      : order.deliveryAddress
    : null

  return (
    <div className={cn(
      'flex flex-col rounded-2xl border-2 overflow-hidden transition-all duration-300',
      'bg-zinc-900',
      isLate ? 'border-red-500/70 shadow-lg shadow-red-900/30' : `border-opacity-40`,
      !isLate && column.border,
    )}>
      {/* Card header */}
      <div className={cn('px-4 py-3 flex items-center justify-between', isLate ? 'bg-red-900/30' : column.headerBg)}>
        <div className="flex items-center gap-2">
          <span className="font-black text-white text-lg tracking-tight">
            #{order.id.slice(-6).toUpperCase()}
          </span>
          {isLate && <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />}
        </div>

        <div className="flex items-center gap-2">
          {/* Type badge */}
          <span className={cn(
            'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
            order.type === 'delivery'
              ? 'bg-purple-500/20 text-purple-300'
              : 'bg-zinc-600/50 text-zinc-300'
          )}>
            {order.type === 'delivery'
              ? <><Truck className="w-3 h-3" />Delivery</>
              : <><Store className="w-3 h-3" />Balcão</>}
          </span>

          {/* Timer */}
          <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-black', timerBg(min))}>
            <Clock className={cn('w-3 h-3', timerColor(min))} />
            <span className={timerColor(min)}>{min}min</span>
          </div>
        </div>
      </div>

      {/* Customer */}
      {order.customerName && (
        <div className="px-4 pt-2.5 pb-0">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Cliente</p>
          <p className="text-sm font-bold text-zinc-200 leading-tight truncate">{order.customerName}</p>
          {order.customerPhone && (
            <p className="text-[11px] text-zinc-400">{order.customerPhone}</p>
          )}
        </div>
      )}

      {/* Address for delivery */}
      {addr && (
        <div className="px-4 pt-1.5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Endereço</p>
          <p className="text-[11px] text-zinc-300 leading-tight">{addr.street}, {addr.number}</p>
          <p className="text-[11px] text-zinc-500">{addr.neighborhood}{addr.city ? ` — ${addr.city}` : ''}</p>
        </div>
      )}

      {/* Items */}
      <div className="flex-1 px-4 pt-3 pb-2 space-y-2">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          Itens ({(order.items ?? []).length})
        </p>
        {(order.items ?? []).map((item: any, idx: number) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 text-zinc-900"
              style={{ backgroundColor: column.accent }}>
              {item.quantity}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight">
                {item.product?.name ?? item.name ?? '—'}
              </p>
              {(item.options ?? []).map((o: any, oi: number) => (
                <p key={oi} className="text-[10px] text-zinc-400">+ {o.name}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Total + print */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <span className="text-xs font-black text-zinc-300">{formatCurrency(order.total ?? 0)}</span>
        <button
          onClick={() => printTicket(order, tenantName)}
          className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-zinc-700"
        >
          <Printer className="w-3.5 h-3.5" />
          Imprimir
        </button>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 grid grid-cols-5 gap-2">
        <button
          onClick={() => onCancel(order.id)}
          className="col-span-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-500 text-[10px] font-bold hover:border-red-500/50 hover:text-red-400 transition-colors"
        >
          ✕
        </button>
        <button
          onClick={() => onAction(order.id, column.action.nextStatus)}
          className="col-span-4 py-2.5 rounded-xl font-black text-sm text-zinc-900 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: column.accent }}
        >
          <column.action.Icon className="w-4 h-4" />
          {column.action.label}
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KDSBoard() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const now = useNow()
  const tenantId = (session?.user as any)?.tenantId
  const tenantName = (session?.user as any)?.tenantName

  const { connected } = useSocket(
    tenantId ? `kitchen:${tenantId}` : undefined,
    {
      new_order: () => queryClient.invalidateQueries({ queryKey: ['kds-orders'] }),
      'order:update': () => queryClient.invalidateQueries({ queryKey: ['kds-orders'] }),
    }
  )

  const { data: orders, isLoading, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['kds-orders'],
    queryFn: () => get<any>('/api/admin/orders'),
    refetchInterval: 30000,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patch<any>(`/api/admin/orders/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kds-orders'] }),
  })

  const ordersArr: any[] = Array.isArray(orders) ? orders : []
  const confirmed  = ordersArr.filter(o => o.status === 'confirmed')
  const preparing  = ordersArr.filter(o => o.status === 'preparing')
  const ready      = ordersArr.filter(o => o.status === 'ready')
  const colData    = [confirmed, preparing, ready]
  const totalActive = confirmed.length + preparing.length + ready.length

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">

      {/* ── Header ── */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center gap-4 shrink-0">
        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <ChefHat className="w-5 h-5 text-zinc-900" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight leading-none">COZINHA</h1>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Kitchen Display</p>
          </div>
        </div>

        {/* Center: status counts */}
        <div className="flex-1 flex items-center justify-center gap-3">
          {COLUMNS.map((col, idx) => (
            <div key={col.id} className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl border',
              col.bg, col.border
            )}>
              <div className={cn('w-2 h-2 rounded-full', col.dot)} />
              <span className="text-[11px] font-black text-zinc-300">{col.label}</span>
              <span className="text-base font-black text-white">{colData[idx].length}</span>
            </div>
          ))}
        </div>

        {/* Right: clock + connection */}
        <div className="flex items-center gap-4">
          {/* Last update */}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            {lastUpdate}
          </button>

          {/* Clock */}
          <div className="text-right">
            <p className="text-lg font-black text-white tabular-nums leading-none">
              {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[9px] text-zinc-500 font-bold">
              {now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).toUpperCase()}
            </p>
          </div>

          {/* Connection */}
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black',
            connected
              ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-400'
              : 'bg-red-900/40 border-red-500/40 text-red-400'
          )}>
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
      </header>

      {/* ── Columns ── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm font-bold">Carregando pedidos…</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden">
          {COLUMNS.map((col, colIdx) => (
            <div key={col.id} className={cn(
              'flex flex-col overflow-hidden',
              colIdx < 2 && 'border-r border-zinc-800'
            )}>
              {/* Column header */}
              <div className={cn(
                'flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800',
                col.bg
              )}>
                <col.Icon className="w-4 h-4" style={{ color: col.accent }} />
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: col.accent }}>
                  {col.label}
                </span>
                <span className="ml-auto w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-zinc-900"
                  style={{ backgroundColor: col.accent }}>
                  {colData[colIdx].length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                {colData[colIdx].length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center opacity-30">
                    <col.Icon className="w-10 h-10 mb-3" style={{ color: col.accent }} />
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Nenhum pedido</p>
                  </div>
                ) : (
                  colData[colIdx].map((order: any) => (
                    <KDSCard
                      key={order.id}
                      order={order}
                      column={col}
                      tenantName={tenantName}
                      onAction={(id, status) => updateStatus.mutate({ id, status })}
                      onCancel={(id) => updateStatus.mutate({ id, status: 'cancelled' })}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && totalActive === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="opacity-10">
            <ChefHat className="w-32 h-32 text-zinc-400 mx-auto mb-4" />
            <p className="text-2xl font-black text-zinc-400 text-center uppercase tracking-widest">
              Aguardando pedidos
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
