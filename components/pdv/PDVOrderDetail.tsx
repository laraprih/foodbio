'use client'

import React, { useState } from 'react'
import {
  X, Printer, ChevronRight, MapPin, Phone, User, Clock,
  CreditCard, Banknote, QrCode, CheckCircle2, AlertCircle,
  Minus, Trash2, Package, Bike, Store, UtensilsCrossed,
  RefreshCw, Plus,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { PAYMENT_METHOD_LABEL } from '@/lib/constants'
import { printPDVReceipt, printKitchenTicket } from '@/lib/pdv-print'
import type { PDVOrder, PDVMenuCategory } from './types'

// ── helpers ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pendente',    color: 'text-gray-600',   bg: 'bg-gray-100' },
  confirmed:  { label: 'Confirmado', color: 'text-blue-700',   bg: 'bg-blue-100' },
  preparing:  { label: 'Preparando', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  ready:      { label: 'Pronto',     color: 'text-green-700',  bg: 'bg-green-100' },
  dispatched: { label: 'Saiu',       color: 'text-indigo-700', bg: 'bg-indigo-100' },
  delivered:  { label: 'Entregue',   color: 'text-emerald-700',bg: 'bg-emerald-100' },
  cancelled:  { label: 'Cancelado',  color: 'text-red-600',    bg: 'bg-red-100' },
}

const PAY_STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Aguardando',  color: 'text-amber-700 bg-amber-100' },
  approved:   { label: 'Pago',        color: 'text-emerald-700 bg-emerald-100' },
  failed:     { label: 'Falhou',      color: 'text-red-600 bg-red-100' },
  refunded:   { label: 'Estornado',   color: 'text-gray-600 bg-gray-100' },
}

const TYPE_ICON: Record<string, React.ElementType> = {
  delivery: Bike,
  pickup:   Store,
  in_store: UtensilsCrossed,
}

const TYPE_LABEL: Record<string, string> = {
  delivery: 'Delivery',
  pickup:   'Balcão',
  in_store: 'Mesa',
}

const PAY_METHODS: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'cash',        label: 'Dinheiro', icon: Banknote   },
  { id: 'pix',         label: 'PIX',      icon: QrCode     },
  { id: 'credit_card', label: 'Crédito',  icon: CreditCard },
  { id: 'debit_card',  label: 'Débito',   icon: CreditCard },
]

const NEXT_STATUS: Record<string, string> = {
  pending:   'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'delivered',
}

const NEXT_LABEL: Record<string, string> = {
  pending:   'Confirmar pedido',
  confirmed: 'Iniciar preparo',
  preparing: 'Marcar pronto',
  ready:     'Finalizar entrega',
}

function buildPrintData(order: PDVOrder, tenantName: string) {
  return {
    orderId: order.id,
    tenantName,
    items: order.items.map(i => ({
      cartId: i.id, productId: '', name: i.name,
      unitPrice: i.unitPrice, basePrice: i.unitPrice,
      quantity: i.quantity, notes: i.notes ?? '', options: [],
    })),
    subtotal: order.subtotal,
    discountAmount: order.discount ?? 0,
    deliveryFee: order.deliveryFee ?? 0,
    total: order.total,
    customerName: order.customerName ?? 'Balcão',
    customerPhone: order.customerPhone ?? '',
    orderType: order.type as any,
    tableNumber: order.tableNumber ?? null,
    payments: [{ method: (order.paymentMethod ?? 'cash') as any, amount: order.total }],
    change: 0,
  }
}

// ── component ──────────────────────────────────────────────────────────────────

interface PDVOrderDetailProps {
  order: PDVOrder
  tenantName: string
  menu: PDVMenuCategory[]
  cashSessionId: string | null
  onClose: () => void
  onRefresh: () => void
}

export function PDVOrderDetail({
  order,
  tenantName,
  menu,
  cashSessionId,
  onClose,
  onRefresh,
}: PDVOrderDetailProps) {
  const qc = useQueryClient()
  const [confirmPay, setConfirmPay] = useState(false)
  const [payMethod, setPayMethod]   = useState<string>(order.paymentMethod ?? 'cash')
  const [cashReceived, setCashReceived] = useState('')
  const [cancelMode, setCancelMode] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [addMode, setAddMode]       = useState(false)
  const [selectedCat, setSelectedCat] = useState(menu[0]?.id ?? '')

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['pdv-orders-today'] })
    onRefresh()
  }

  // Status mutation
  const statusMut = useMutation({
    mutationFn: ({ status, cancelReason }: { status: string; cancelReason?: string }) =>
      fetch(`/api/pdv/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, cancelReason }),
      }).then(r => r.json()),
    onSuccess: () => { toast.success('Pedido atualizado'); invalidate() },
    onError: () => toast.error('Erro ao atualizar pedido'),
  })

  // Payment mutation
  const payMut = useMutation({
    mutationFn: () =>
      fetch(`/api/pdv/orders/${order.id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: payMethod, cashSessionId }),
      }).then(r => r.json()),
    onSuccess: () => {
      toast.success('Pagamento confirmado!')
      setConfirmPay(false)
      invalidate()
    },
    onError: () => toast.error('Erro ao confirmar pagamento'),
  })

  // Remove item mutation
  const removeItemMut = useMutation({
    mutationFn: (itemId: string) =>
      fetch(`/api/pdv/orders/${order.id}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      }).then(r => r.json()),
    onSuccess: () => { toast.success('Item removido'); invalidate() },
    onError: () => toast.error('Erro ao remover item'),
  })

  // Add item mutation
  const addItemMut = useMutation({
    mutationFn: (item: any) =>
      fetch(`/api/pdv/orders/${order.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [item] }),
      }).then(r => r.json()),
    onSuccess: () => { toast.success('Item adicionado'); setAddMode(false); invalidate() },
    onError: () => toast.error('Erro ao adicionar item'),
  })

  const isActive    = !['delivered', 'cancelled'].includes(order.status)
  const isPaid      = order.paymentStatus === 'approved'
  const nextStatus  = NEXT_STATUS[order.status]
  const statusCfg   = STATUS_CFG[order.status] ?? STATUS_CFG.pending
  const payStatusCfg = PAY_STATUS_CFG[order.paymentStatus] ?? PAY_STATUS_CFG.pending
  const TypeIcon    = TYPE_ICON[order.type] ?? Store
  const addr        = order.deliveryAddress

  const troco = (() => {
    const recv = parseFloat(cashReceived.replace(',', '.'))
    if (isNaN(recv) || recv < order.total) return null
    return recv - order.total
  })()

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">#{order.id.slice(-8).toUpperCase()}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${payStatusCfg.color}`}>
              {payStatusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
            <TypeIcon className="w-3.5 h-3.5" />
            <span>{TYPE_LABEL[order.type]}</span>
            {order.tableNumber && <span>· Mesa {order.tableNumber}</span>}
            {order.origin === 'garcom' && <span className="text-lime-600 font-semibold">· Garçom</span>}
            {order.waiterName && <span className="text-lime-600">({order.waiterName})</span>}
            <span className="ml-1 text-gray-400">
              {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Cliente */}
        <section className="px-5 py-3 border-b border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Cliente</p>
          <div className="space-y-1">
            {order.customerName && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-semibold">{order.customerName}</span>
              </div>
            )}
            {order.customerPhone && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{order.customerPhone}</span>
              </div>
            )}
          </div>
        </section>

        {/* Endereço delivery */}
        {order.type === 'delivery' && addr && (
          <section className="px-5 py-3 border-b border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Endereço de Entrega</p>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{addr.street}{addr.number ? `, ${addr.number}` : ''}</p>
                {addr.complement && <p className="text-gray-500 text-xs">{addr.complement}</p>}
                <p className="text-gray-500 text-xs">{[addr.neighborhood, addr.city, addr.state].filter(Boolean).join(', ')}</p>
                {addr.cep && <p className="text-gray-400 text-xs">CEP {addr.cep}</p>}
              </div>
            </div>
          </section>
        )}

        {/* Itens */}
        <section className="px-5 py-3 border-b border-gray-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Itens ({order.items.length})
            </p>
            {isActive && (
              <button
                onClick={() => setAddMode(!addMode)}
                className="flex items-center gap-1 text-xs font-semibold text-lime-700 hover:text-lime-900"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            )}
          </div>

          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex items-start gap-2">
                <span className="text-xs font-black text-gray-900 w-6 text-center pt-0.5">{item.quantity}×</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  {item.options?.length > 0 && (
                    <p className="text-xs text-gray-400">
                      {item.options.map(o => o.name).join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-amber-600 italic">"{item.notes}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(item.totalPrice)}</span>
                  {isActive && (
                    <button
                      onClick={() => {
                        if (confirm(`Remover ${item.name}?`)) removeItemMut.mutate(item.id)
                      }}
                      className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add item inline catalog */}
          {addMode && (
            <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex overflow-x-auto gap-1 p-2 bg-gray-50 border-b border-gray-100">
                {menu.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                      selectedCat === cat.id
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                {(menu.find(c => c.id === selectedCat)?.products ?? [])
                  .filter(p => p.available)
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => addItemMut.mutate({
                        productId: p.id,
                        quantity: 1,
                        unitPrice: p.price,
                        options: [],
                        notes: '',
                      })}
                      disabled={addItemMut.isPending}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-800">{p.name}</span>
                      <span className="text-sm font-bold text-gray-900 shrink-0 ml-2">{formatCurrency(p.price)}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </section>

        {/* Notas do pedido */}
        {order.notes && (
          <section className="px-5 py-3 border-b border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Observação</p>
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 italic">"{order.notes}"</p>
          </section>
        )}

        {/* Cancelamento */}
        {order.cancelReason && (
          <section className="px-5 py-3 border-b border-gray-50">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Motivo do cancelamento</p>
            <p className="text-sm text-red-600">{order.cancelReason}</p>
          </section>
        )}

        {/* Totais */}
        <section className="px-5 py-3 border-b border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Valores</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                <span>Desconto</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Taxa entrega</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-gray-900 pt-1 border-t border-gray-100">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            {order.paymentMethod && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Pagamento</span>
                <span>{PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}</span>
              </div>
            )}
          </div>
        </section>

        {/* ── Confirmação de pagamento (inline) ── */}
        {confirmPay && (
          <section className="px-5 py-3 border-b border-gray-50 bg-amber-50">
            <p className="text-xs font-bold text-amber-800 mb-3">Confirmar Pagamento — {formatCurrency(order.total)}</p>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {PAY_METHODS.map(m => {
                const Icon = m.icon
                return (
                  <button
                    key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl border-2 text-[10px] font-bold transition-all ${
                      payMethod === m.id
                        ? 'border-amber-500 bg-amber-100 text-amber-800'
                        : 'border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {m.label}
                  </button>
                )
              })}
            </div>

            {payMethod === 'cash' && (
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Valor recebido</label>
                <input
                  type="number"
                  step="0.01"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  placeholder={order.total.toFixed(2)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-amber-400"
                />
                {troco !== null && (
                  <div className="mt-1.5 flex justify-between text-sm font-bold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5">
                    <span>Troco</span><span>{formatCurrency(troco)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmPay(false)}
                className="flex-none px-4 py-2 rounded-xl text-xs font-bold text-gray-500 bg-white border border-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => payMut.mutate()}
                disabled={payMut.isPending || (payMethod === 'cash' && troco === null && cashReceived !== '')}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {payMut.isPending ? 'Confirmando…' : 'Confirmar pagamento'}
              </button>
            </div>
          </section>
        )}

        {/* ── Cancelamento (inline) ── */}
        {cancelMode && (
          <section className="px-5 py-3 border-b border-gray-50 bg-red-50">
            <p className="text-xs font-bold text-red-700 mb-2">Cancelar Pedido</p>
            <input
              autoFocus
              type="text"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Motivo do cancelamento"
              className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm bg-white mb-2 focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setCancelMode(false)}
                className="flex-none px-4 py-2 rounded-xl text-xs font-bold text-gray-500 bg-white border border-gray-200">
                Voltar
              </button>
              <button
                onClick={() => statusMut.mutate({ status: 'cancelled', cancelReason })}
                disabled={statusMut.isPending}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {statusMut.isPending ? 'Cancelando…' : 'Confirmar cancelamento'}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Footer de ações */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 shrink-0 space-y-2">
        {/* Confirmar pagamento */}
        {!isPaid && !confirmPay && !cancelMode && (
          <button
            onClick={() => setConfirmPay(true)}
            className="w-full py-2.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all active:scale-98"
            style={{ backgroundColor: 'var(--color-lime-primary, #84cc16)' }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirmar Pagamento — {formatCurrency(order.total)}
          </button>
        )}

        {/* Avançar status */}
        {isActive && nextStatus && !confirmPay && !cancelMode && (
          <button
            onClick={() => statusMut.mutate({ status: nextStatus })}
            disabled={statusMut.isPending}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-gray-900 bg-white border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            {NEXT_LABEL[order.status]}
          </button>
        )}

        {/* Imprimir */}
        <div className="flex gap-2">
          <button
            onClick={() => printPDVReceipt(buildPrintData(order, tenantName))}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 flex items-center justify-center gap-1.5 hover:bg-gray-100"
          >
            <Printer className="w-3.5 h-3.5" />Cupom
          </button>
          <button
            onClick={() => printKitchenTicket(buildPrintData(order, tenantName))}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 flex items-center justify-center gap-1.5 hover:bg-gray-100"
          >
            <Package className="w-3.5 h-3.5" />Cozinha
          </button>
        </div>

        {/* Cancelar pedido */}
        {isActive && !cancelMode && !confirmPay && (
          <button
            onClick={() => setCancelMode(true)}
            className="w-full py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-50 hover:text-red-600 border border-red-100 transition-colors"
          >
            Cancelar pedido
          </button>
        )}
      </div>
    </div>
  )
}
