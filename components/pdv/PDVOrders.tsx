'use client'

import React, { useState } from 'react'
import { ClipboardList, ChevronDown, ChevronUp, X, Printer } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PDVOrder } from './types'
import { toast } from 'react-hot-toast'
import { printKitchenTicket, printPDVReceipt } from '@/lib/pdv-print'

function buildPrintData(order: PDVOrder, tenantName: string) {
  return {
    orderId: order.id,
    tenantName,
    items: order.items.map(i => ({
      cartId: i.id,
      productId: '',
      name: i.name,
      unitPrice: i.unitPrice,
      basePrice: i.unitPrice,
      quantity: i.quantity,
      notes: i.notes ?? '',
      options: [],
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

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendente',    color: 'bg-gray-100 text-gray-600' },
  confirmed:  { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  preparing:  { label: 'Preparando', color: 'bg-yellow-100 text-yellow-700' },
  ready:      { label: 'Pronto',     color: 'bg-green-100 text-green-700' },
  dispatched: { label: 'Saiu',       color: 'bg-indigo-100 text-indigo-700' },
  delivered:  { label: 'Entregue',   color: 'bg-emerald-100 text-emerald-700' },
  cancelled:  { label: 'Cancelado',  color: 'bg-red-100 text-red-600' },
}

const TYPE_LABEL: Record<string, string> = {
  pickup:   '🏪 Balcão',
  in_store: '🪑 Mesa',
  delivery: '🚴 Delivery',
}

const FILTERS = ['Todos', 'Pendente', 'Preparando', 'Pronto', 'Entregue', 'Cancelado'] as const

export function PDVOrders({ tenantName = '' }: { tenantName?: string }) {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('Todos')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const { data, isLoading } = useQuery<{ orders: PDVOrder[] }>({
    queryKey: ['pdv-orders-today'],
    queryFn: () => fetch('/api/pdv/orders/today').then(r => r.json()),
    refetchInterval: 8_000,
  })

  const orders = data?.orders ?? []

  const filtered = filter === 'Todos'
    ? orders
    : orders.filter(o => {
        const label = STATUS_LABEL[o.status]?.label ?? ''
        return label === filter
      })

  const statusMutation = useMutation({
    mutationFn: ({ id, status, cancelReason }: { id: string; status: string; cancelReason?: string }) =>
      fetch(`/api/pdv/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, cancelReason }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdv-orders-today'] })
      setCancelId(null)
      setCancelReason('')
      toast.success('Pedido atualizado')
    },
    onError: () => toast.error('Erro ao atualizar pedido'),
  })

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-black text-gray-900 text-lg">Pedidos de Hoje</h2>
          <p className="text-xs text-gray-500">{orders.length} pedidos · {orders.filter(o => !['delivered','cancelled'].includes(o.status)).length} em aberto</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-6 py-3 overflow-x-auto no-scrollbar bg-white border-b border-gray-100 shrink-0">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <ClipboardList className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhum pedido encontrado</p>
          </div>
        ) : filtered.map(order => {
          const isOpen = expanded === order.id
          const statusCfg = STATUS_LABEL[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' }
          const isActive = !['delivered', 'cancelled'].includes(order.status)
          const time = new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

          return (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header row */}
              <button
                onClick={() => setExpanded(isOpen ? null : order.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-mono">{time}</span>
                  <div>
                    <p className="text-sm font-black text-gray-900">{order.customerName ?? 'Balcão'}</p>
                    <p className="text-xs text-gray-500">{TYPE_LABEL[order.type] ?? order.type}{order.tableNumber ? ` · Mesa ${order.tableNumber}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  <span className="text-sm font-black text-gray-900">R$ {order.total.toFixed(2)}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                  {/* Items */}
                  <div className="space-y-1.5">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="text-gray-700 font-semibold">{item.quantity}× {item.name}</span>
                        <span className="text-gray-500 font-bold">R$ {item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-100 pt-2 space-y-1">
                    {order.discount > 0 && (
                      <div className="flex justify-between text-xs text-green-600 font-semibold">
                        <span>Desconto</span><span>-R$ {order.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {order.deliveryFee > 0 && (
                      <div className="flex justify-between text-xs text-gray-500 font-semibold">
                        <span>Taxa entrega</span><span>R$ {order.deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-gray-900">
                      <span>Total</span><span>R$ {order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Reprint */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => printPDVReceipt(buildPrintData(order, tenantName))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cupom
                    </button>
                    <button
                      onClick={() => printKitchenTicket(buildPrintData(order, tenantName))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cozinha
                    </button>
                  </div>

                  {/* Actions */}
                  {isActive && (
                    <div className="flex gap-2 pt-1">
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: order.id, status: 'preparing' })}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                        >
                          Iniciar preparo
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: order.id, status: 'ready' })}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                          Marcar pronto
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: order.id, status: 'delivered' })}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-900 hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: 'var(--color-lime-primary)' }}
                        >
                          Finalizar entrega
                        </button>
                      )}
                      {cancelId === order.id ? (
                        <div className="flex-1 flex flex-col gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            placeholder="Motivo do cancelamento"
                            className="w-full bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => statusMutation.mutate({ id: order.id, status: 'cancelled', cancelReason })}
                              className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              Confirmar cancelamento
                            </button>
                            <button onClick={() => setCancelId(null)} className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancelId(order.id)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors border border-red-100"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
