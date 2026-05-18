'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSectionAuth } from '@/hooks/use-section-auth'
import { useSocket } from '@/hooks/use-socket'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import {
  Wifi, WifiOff, ChefHat, Clock, Printer,
  CheckCircle, Package, Bell, Flame,
  AlertTriangle, Truck, Store, RefreshCw,
  TableProperties, Globe, Receipt, X,
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

// ── columns config ────────────────────────────────────────────────────────────

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
type Origin = 'all' | 'online' | 'pdv'

const ORIGIN_TABS: { id: Origin; label: string; Icon: React.ElementType }[] = [
  { id: 'all',    label: 'Todos',    Icon: ChefHat },
  { id: 'online', label: 'Online',   Icon: Globe },
  { id: 'pdv',    label: 'Presencial / PDV', Icon: Receipt },
]

// ── print comanda ─────────────────────────────────────────────────────────────

function printComanda(order: any, tenantName?: string) {
  const addr = order.deliveryAddress
    ? typeof order.deliveryAddress === 'string'
      ? (() => { try { return JSON.parse(order.deliveryAddress) } catch { return null } })()
      : order.deliveryAddress
    : null

  const date    = new Date(order.createdAt)
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const num     = order.id.slice(-8).toUpperCase()

  const typeLabel =
    order.type === 'in_store' ? `🪑 MESA ${order.tableNumber ?? ''}` :
    order.type === 'delivery' ? '🛵 DELIVERY' : '🏪 BALCÃO'

  const originBadge = order.origin === 'pdv'
    ? `<span style="background:#f3e8ff;color:#7c3aed;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:900">PDV</span>`
    : `<span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:900">ONLINE</span>`

  const rows = (order.items ?? []).map((it: any) => `
    <div style="margin:6px 0;padding:6px 0;border-bottom:1px dashed #ccc">
      <div style="display:flex;gap:8px;align-items:flex-start">
        <span style="font-weight:900;font-size:22px;min-width:32px;color:#000">${it.quantity}x</span>
        <div>
          <div style="font-size:16px;font-weight:700">${it.name}</div>
          ${(it.options ?? []).map((o: any) => `<div style="font-size:12px;color:#555">+ ${o.name}</div>`).join('')}
          ${it.notes ? `<div style="font-size:12px;font-weight:700;color:#d97706;margin-top:2px">⚠ ${it.notes}</div>` : ''}
        </div>
      </div>
    </div>
  `).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Comanda #${num}</title>
<style>
  * { margin:0;padding:0;box-sizing:border-box }
  body { font-family:'Courier New',monospace;width:80mm;margin:0 auto;padding:5mm 4mm;color:#000 }
  .c { text-align:center }
  .hr { border:none;border-top:2px solid #000;margin:8px 0 }
  @media print { @page { margin:0;size:80mm auto } body { margin:0 } }
</style></head><body>
  <div class="c" style="margin-bottom:6px">
    <div style="font-weight:900;font-size:18px">${tenantName ?? 'COZINHA'}</div>
    <div style="font-size:11px">${timeStr}</div>
  </div>
  <div class="hr"/>
  <div class="c" style="margin:8px 0">
    <div style="font-size:11px;font-weight:700;letter-spacing:1px">COMANDA</div>
    <div style="font-weight:900;font-size:32px">#${num}</div>
  </div>
  <div class="c" style="margin:6px 0">
    <div style="border:2px solid #000;border-radius:4px;display:inline-block;padding:2px 12px;font-weight:900;font-size:14px">
      ${typeLabel}
    </div>
  </div>
  <div class="c" style="margin:4px 0">${originBadge}</div>
  ${order.customerName ? `<div class="c" style="font-size:14px;font-weight:700;margin:4px 0">${order.customerName}</div>` : ''}
  <div class="hr"/>
  ${rows}
  ${addr ? `
  <div class="hr"/>
  <div style="font-weight:900;font-size:13px;margin-bottom:3px">ENDEREÇO:</div>
  <div style="font-size:13px">${addr.street}, ${addr.number}${addr.complement ? ` — ${addr.complement}` : ''}</div>
  <div style="font-size:12px">${addr.neighborhood}${addr.city ? ` · ${addr.city}/${addr.state}` : ''}</div>
  ` : ''}
  <div class="hr"/>
  <div class="c" style="font-size:12px">Total: ${formatCurrency(order.total ?? 0)}</div>
</body></html>`

  const win = window.open('', '_blank', 'width=420,height=640')
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
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60000)
    return () => clearInterval(t)
  }, [])

  const min    = elapsed(order.createdAt)
  const isLate = min >= 20

  const isReadyCol = col.id === 'ready'
  const actionNextStatus: string = isReadyCol
    ? (order.type === 'delivery' ? 'dispatched' : 'delivered')
    : col.nextStatus
  const actionLabel = isReadyCol
    ? (order.type === 'delivery' ? 'Saiu pra entrega' : order.type === 'in_store' ? 'Entregue na mesa' : 'Confirmar Retirada')
    : col.actionLabel
  const ActionIcon = isReadyCol
    ? (order.type === 'delivery' ? Truck : order.type === 'in_store' ? TableProperties : Store)
    : col.ActionIcon

  const addr = order.deliveryAddress
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

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* Origin badge */}
          <span className={cn(
            'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
            order.origin === 'pdv'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          )}>
            {order.origin === 'pdv'
              ? <Receipt className="w-2.5 h-2.5" />
              : <Globe className="w-2.5 h-2.5" />}
            {order.origin === 'pdv' ? 'PDV' : 'Online'}
          </span>

          {/* Type badge */}
          <span className={cn(
            'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
            order.type === 'delivery' ? 'bg-lime-100 text-lime-700' :
            order.type === 'in_store' ? 'bg-orange-100 text-orange-700' :
            'bg-gray-100 text-gray-600'
          )}>
            {order.type === 'delivery'  ? <><Truck className="w-2.5 h-2.5" />Delivery</> :
             order.type === 'in_store'  ? <><TableProperties className="w-2.5 h-2.5" />Mesa {order.tableNumber}</> :
             <><Store className="w-2.5 h-2.5" />Balcão</>}
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
        {/* Mesa destaque */}
        {order.type === 'in_store' && order.tableNumber && (
          <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2">
            <TableProperties className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="font-black text-orange-800 text-lg">Mesa {order.tableNumber}</span>
          </div>
        )}

        {/* Cliente */}
        {order.customerName && (
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Cliente</p>
            <p className="text-sm font-bold text-gray-900 leading-tight truncate">{order.customerName}</p>
            {order.customerPhone && <p className="text-[11px] text-gray-400">{order.customerPhone}</p>}
          </div>
        )}

        {/* Endereço delivery */}
        {addr && (
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Endereço</p>
            <p className="text-xs text-gray-700 leading-tight">{addr.street}, {addr.number}</p>
            <p className="text-[11px] text-gray-400">{addr.neighborhood}{addr.city ? ` — ${addr.city}` : ''}</p>
          </div>
        )}

        {/* Itens */}
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Itens ({(order.items ?? []).length})
          </p>
          <div className="space-y-2">
            {(order.items ?? []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm shrink-0 text-gray-900"
                  style={{ backgroundColor: 'var(--color-lime-primary)' }}
                >
                  {item.quantity}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-bold text-gray-800 leading-tight">
                    {item.name}
                  </p>
                  {(item.options ?? []).map((o: any, oi: number) => (
                    <p key={oi} className="text-[10px] text-gray-400">+ {o.name}</p>
                  ))}
                  {item.notes && (
                    <p className="text-[11px] font-bold text-amber-600 mt-0.5">⚠ {item.notes}</p>
                  )}
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
          onClick={() => printComanda(order, tenantName)}
          className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-[var(--color-lime-primary)] transition-colors py-1 px-2 rounded-lg hover:bg-[var(--color-lime-primary)]/5"
        >
          <Printer className="w-3.5 h-3.5" />
          Comanda
        </button>
      </div>

      {/* Cancel form */}
      {showCancel ? (
        <div className="px-3 pb-3 space-y-2">
          <input
            autoFocus
            type="text"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Motivo do cancelamento"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setShowCancel(false); setCancelReason('') }}
              className="py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-500"
            >
              Voltar
            </button>
            <button
              onClick={() => { onCancel(order.id); setShowCancel(false) }}
              className="py-2 rounded-xl text-xs font-bold bg-red-600 text-white"
            >
              Confirmar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2 px-3 pb-3">
          <button
            onClick={() => setShowCancel(true)}
            className="col-span-1 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-xs font-bold hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <X className="w-3.5 h-3.5 mx-auto" />
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
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function KDSBoard() {
  const params  = useParams()
  const router  = useRouter()
  const slug    = params.slug as string
  const qc      = useQueryClient()
  const { user, status } = useSectionAuth('cozinha')
  const now     = useNow()

  const tenantId   = user?.tenantId
  const tenantName = user?.tenantName

  const [activeTab, setActiveTab] = useState(0)
  const [origin, setOrigin] = useState<Origin>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/${slug}/cozinha/login?callbackUrl=/${slug}/cozinha`)
    }
  }, [status, slug, router])

  const { connected } = useSocket(
    tenantId ? `kitchen:${tenantId}` : undefined,
    {
      new_order:      () => qc.invalidateQueries({ queryKey: ['kds-orders', origin] }),
      'order:update': () => qc.invalidateQueries({ queryKey: ['kds-orders', origin] }),
    }
  )

  const { data: orders = [], isLoading, dataUpdatedAt, refetch } = useQuery<any[]>({
    queryKey: ['kds-orders', origin],
    queryFn: () =>
      fetch(`/api/kitchen/orders?origin=${origin}`)
        .then(r => r.json()),
    refetchInterval: 5_000,
    enabled: status === 'authenticated',
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status, cancelReason }: { id: string; status: string; cancelReason?: string }) =>
      fetch(`/api/kitchen/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, cancelReason }),
      }).then(r => r.json()),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['kds-orders', origin] })
      const prev = qc.getQueryData(['kds-orders', origin])
      qc.setQueryData(['kds-orders', origin], (old: any) =>
        Array.isArray(old) ? old.map((o: any) => o.id === id ? { ...o, status } : o) : old
      )
      return { prev }
    },
    onError: (_e, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(['kds-orders', origin], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['kds-orders', origin] }),
  })

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-lime-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (user?.role !== 'cook') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-semibold">Acesso não autorizado</p>
      </div>
    )
  }

  const colData = [
    (orders as any[]).filter(o => o.status === 'confirmed'),
    (orders as any[]).filter(o => o.status === 'preparing'),
    (orders as any[]).filter(o => o.status === 'ready'),
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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--color-lime-primary)' }}>
            <ChefHat className="w-5 h-5 text-gray-900" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-gray-900 text-sm leading-none">Cozinha</h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Kitchen Display</p>
          </div>

          <div className="hidden sm:flex items-center gap-2 ml-2">
            {COLUMNS.map((col, idx) => (
              <span key={col.id} className={cn('text-xs font-bold px-2.5 py-1 rounded-full', col.badgeBg)}>
                <col.Icon className="w-3 h-3 inline mr-1" />{colData[idx].length}
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button
              onClick={() => refetch()}
              className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              <RefreshCw className="w-3 h-3" />
              {lastUpdate}
            </button>
            <span className="hidden md:block text-sm font-black text-gray-700 tabular-nums">
              {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
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

        {/* Origin filter */}
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
          {ORIGIN_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setOrigin(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all border',
                origin === t.id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              )}
            >
              <t.Icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
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
                  ? 'border-[var(--color-lime-primary)] text-[var(--color-lime-primary)]'
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
          {/* Desktop: 3 colunas */}
          <div className="hidden lg:grid lg:grid-cols-3 flex-1 min-h-0 overflow-hidden">
            {COLUMNS.map((col, idx) => (
              <div key={col.id} className={cn('flex flex-col overflow-hidden', idx < 2 && 'border-r border-gray-200')}>
                <div className={cn('flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 shrink-0', col.headerBg)}>
                  <col.Icon className={cn('w-4 h-4', col.headerText)} />
                  <span className={cn('text-xs font-black uppercase tracking-wider', col.headerText)}>{col.label}</span>
                  <span className={cn('ml-auto text-xs font-black text-white w-5 h-5 rounded-full flex items-center justify-center', col.countBg)}>
                    {colData[idx].length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
                  {colData[idx].length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 opacity-40">
                      <col.Icon className={cn('w-10 h-10 mb-2', col.headerText)} />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nenhum pedido</p>
                    </div>
                  ) : colData[idx].map((order: any) => (
                    <OrderCard key={order.id} order={order} {...cardProps(col)} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tablet: 2 colunas + prontos embaixo */}
          <div className="hidden md:flex lg:hidden flex-1 min-h-0 flex-col overflow-hidden">
            <div className="grid grid-cols-2 flex-1 min-h-0 border-b border-gray-200 overflow-hidden">
              {COLUMNS.slice(0, 2).map((col, idx) => (
                <div key={col.id} className={cn('flex flex-col overflow-hidden', idx === 0 && 'border-r border-gray-200')}>
                  <div className={cn('flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0', col.headerBg)}>
                    <col.Icon className={cn('w-3.5 h-3.5', col.headerText)} />
                    <span className={cn('text-xs font-black uppercase tracking-wider', col.headerText)}>{col.label}</span>
                    <span className={cn('ml-auto text-xs font-black text-white w-5 h-5 rounded-full flex items-center justify-center', col.countBg)}>{colData[idx].length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
                    {colData[idx].length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-8 opacity-40">
                        <col.Icon className={cn('w-8 h-8 mb-2', col.headerText)} />
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Nenhum</p>
                      </div>
                    ) : colData[idx].map((order: any) => (
                      <OrderCard key={order.id} order={order} {...cardProps(col)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {(() => {
              const readyCol = COLUMNS[2]
              return (
                <div className="shrink-0 max-h-[40%] flex flex-col overflow-hidden">
                  <div className={cn('flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0', readyCol.headerBg)}>
                    <readyCol.Icon className={cn('w-3.5 h-3.5', readyCol.headerText)} />
                    <span className={cn('text-xs font-black uppercase tracking-wider', readyCol.headerText)}>{readyCol.label}</span>
                    <span className={cn('ml-auto text-xs font-black text-white w-5 h-5 rounded-full flex items-center justify-center', readyCol.countBg)}>{colData[2].length}</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar p-3">
                    {colData[2].length === 0 ? (
                      <div className="flex-1 flex items-center justify-center py-6 opacity-40">
                        <p className="text-xs font-bold text-gray-400 uppercase">Nenhum pronto</p>
                      </div>
                    ) : colData[2].map((order: any) => (
                      <div key={order.id} className="w-72 shrink-0">
                        <OrderCard order={order} {...cardProps(readyCol)} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Mobile: abas */}
          <div className="flex md:hidden flex-1 min-h-0 overflow-hidden">
            {COLUMNS.map((col, idx) => (
              <div
                key={col.id}
                className={cn('flex-1 overflow-y-auto no-scrollbar p-3 space-y-3', activeTab !== idx && 'hidden')}
              >
                {colData[idx].length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 opacity-40">
                    <col.Icon className={cn('w-12 h-12 mb-3', col.headerText)} />
                    <p className="text-sm font-bold text-gray-400 uppercase">{col.label}</p>
                  </div>
                ) : colData[idx].map((order: any) => (
                  <OrderCard key={order.id} order={order} {...cardProps(col)} />
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {!isLoading && total === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none" style={{ top: 160 }}>
          <ChefHat className="w-20 h-20 text-gray-200 mx-auto mb-3" />
          <p className="text-lg font-black text-gray-200 uppercase tracking-widest">Aguardando pedidos</p>
        </div>
      )}
    </div>
  )
}
