'use client'

import React, { useState, useMemo } from 'react'
import {
  X, QrCode, CreditCard, Banknote, CheckCircle2, Copy, Check,
  Clock, ChevronDown, ChevronUp,
} from 'lucide-react'
import { formatCurrency, formatOrderTime } from '@/lib/utils'
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/lib/constants'
import { buildPixPayload, pixQrCodeUrl } from '@/lib/pix'
import { cn } from '@/lib/utils'
import type { GarcomTable, GarcomOrder } from './types'

type PayMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash'

interface PixInfo {
  pixKey: string | null
  name: string
  city: string
}

interface GarcomBillModalProps {
  table: GarcomTable
  orders: GarcomOrder[]
  pendingTotal: number
  pixInfo: PixInfo | null
  onClose: () => void
  onConfirm: (method: PayMethod) => Promise<void>
}

const METHOD_OPTIONS: { id: PayMethod; label: string; icon: React.ElementType }[] = [
  { id: 'pix',         label: 'PIX',          icon: QrCode    },
  { id: 'credit_card', label: 'Crédito',       icon: CreditCard },
  { id: 'debit_card',  label: 'Débito',        icon: CreditCard },
  { id: 'cash',        label: 'Dinheiro',      icon: Banknote  },
]

export function GarcomBillModal({
  table,
  orders,
  pendingTotal,
  pixInfo,
  onClose,
  onConfirm,
}: GarcomBillModalProps) {
  const [method, setMethod] = useState<PayMethod>('pix')
  const [cashReceived, setCashReceived] = useState('')
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [paid, setPaid] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // Gera payload e URL do QR code apenas quando necessário
  const pixPayload = useMemo(() => {
    if (method !== 'pix' || !pixInfo?.pixKey) return null
    return buildPixPayload({
      key:    pixInfo.pixKey,
      name:   pixInfo.name,
      city:   pixInfo.city,
      amount: pendingTotal,
      txid:   `MESA${table.number}`,
    })
  }, [method, pixInfo, pendingTotal, table.number])

  const qrUrl = pixPayload ? pixQrCodeUrl(pixPayload) : null

  const troco = useMemo(() => {
    const recv = parseFloat(cashReceived.replace(',', '.'))
    if (isNaN(recv) || recv < pendingTotal) return null
    return recv - pendingTotal
  }, [cashReceived, pendingTotal])

  const canConfirm =
    method !== 'cash' || (troco !== null)

  const handleCopyKey = async () => {
    if (!pixInfo?.pixKey) return
    await navigator.clipboard.writeText(pixInfo.pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyPayload = async () => {
    if (!pixPayload) return
    await navigator.clipboard.writeText(pixPayload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirm = async () => {
    if (!canConfirm || confirming) return
    setConfirming(true)
    try {
      await onConfirm(method)
      setPaid(true)
    } catch {
      setConfirming(false)
    }
  }

  // ── Tela de sucesso ──────────────────────────────────────────────────────
  if (paid) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-900">Pagamento confirmado!</h2>
            <p className="text-gray-500 mt-2">Mesa {table.number} liberada</p>
            <p className="text-3xl font-black text-emerald-600 mt-4">{formatCurrency(pendingTotal)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full h-12 rounded-2xl font-bold text-white"
            style={{ backgroundColor: 'var(--color-lime-primary, #84cc16)' }}
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center h-14 px-4 gap-3 border-b border-gray-100">
        <button onClick={onClose} className="p-2 -ml-1 rounded-full hover:bg-gray-100">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <p className="font-black text-gray-900 leading-tight">Conta — Mesa {table.number}</p>
          <p className="text-xs text-gray-400">{orders.length} pedido{orders.length !== 1 ? 's' : ''} em aberto</p>
        </div>
        <p className="text-xl font-black text-gray-900">{formatCurrency(pendingTotal)}</p>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Resumo dos pedidos */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Itens consumidos</p>
          <div className="space-y-2">
            {orders.map(order => {
              const isOpen = expandedOrder === order.id
              return (
                <div key={order.id} className="bg-gray-50 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3"
                    onClick={() => setExpandedOrder(isOpen ? null : order.id)}
                  >
                    <div className="flex items-center gap-2 text-left">
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-500">{formatOrderTime(order.createdAt)}</span>
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                        ORDER_STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-600'
                      )}>
                        {ORDER_STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</span>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 divide-y divide-gray-100">
                      {(order.items ?? []).map(item => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs font-bold text-gray-400 w-5 text-center">{item.quantity}×</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                            {item.options?.length ? (
                              <p className="text-xs text-gray-400 truncate">
                                {item.options.map((o: any) => o.name).join(', ')}
                              </p>
                            ) : null}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 shrink-0">
                            {formatCurrency(item.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Total */}
        <div className="mx-4 my-3 flex justify-between items-center bg-gray-900 rounded-xl px-4 py-3">
          <span className="text-sm font-bold text-white">Total</span>
          <span className="text-xl font-black text-white">{formatCurrency(pendingTotal)}</span>
        </div>

        {/* Seletor de método */}
        <div className="px-4 pt-2 pb-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Forma de pagamento</p>
          <div className="grid grid-cols-4 gap-2">
            {METHOD_OPTIONS.map(opt => {
              const Icon = opt.icon
              const active = method === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setMethod(opt.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all text-center',
                    active
                      ? 'border-lime-400 bg-lime-50 text-lime-800'
                      : 'border-gray-100 bg-gray-50 text-gray-500'
                  )}
                >
                  <Icon className={cn('w-5 h-5', active ? 'text-lime-600' : 'text-gray-400')} />
                  <span className="text-[10px] font-bold leading-tight">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── PIX ── */}
        {method === 'pix' && (
          <div className="px-4 py-4 flex flex-col items-center gap-4">
            {pixInfo?.pixKey ? (
              <>
                {qrUrl && (
                  <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="QR Code PIX"
                      width={240}
                      height={240}
                      className="rounded-xl"
                    />
                  </div>
                )}

                <div className="w-full bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Chave PIX</p>
                  <p className="text-sm font-bold text-gray-900">{pixInfo.pixKey}</p>
                </div>

                <div className="flex w-full gap-2">
                  <button
                    onClick={handleCopyKey}
                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 active:scale-95 transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar chave'}
                  </button>
                  <button
                    onClick={handleCopyPayload}
                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 active:scale-95 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    Copia e cola
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Após o cliente pagar, toque em "Confirmar pagamento"
                </p>
              </>
            ) : (
              <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-sm font-bold text-amber-700">Chave PIX não configurada</p>
                <p className="text-xs text-amber-600 mt-1">
                  Adicione o telefone do restaurante em Configurações para habilitar o PIX.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Cartão ── */}
        {(method === 'credit_card' || method === 'debit_card') && (
          <div className="px-4 py-6 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-base font-bold text-gray-900">Pagamento via {method === 'credit_card' ? 'Crédito' : 'Débito'}</p>
            <p className="text-3xl font-black text-gray-900">{formatCurrency(pendingTotal)}</p>
            <p className="text-xs text-gray-400 text-center">
              Passe o cartão na maquininha e confirme o pagamento abaixo.
            </p>
          </div>
        )}

        {/* ── Dinheiro ── */}
        {method === 'cash' && (
          <div className="px-4 py-4 space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Banknote className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-gray-900">{formatCurrency(pendingTotal)}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Valor recebido (R$)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={pendingTotal}
                value={cashReceived}
                onChange={e => setCashReceived(e.target.value)}
                placeholder={pendingTotal.toFixed(2)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-black text-gray-900 focus:outline-none focus:border-lime-400 text-center"
              />
            </div>

            {troco !== null && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="text-sm font-bold text-emerald-700">Troco</span>
                <span className="text-xl font-black text-emerald-700">{formatCurrency(troco)}</span>
              </div>
            )}

            {cashReceived && troco === null && (
              <p className="text-xs text-red-500 text-center">
                Valor insuficiente — faltam {formatCurrency(pendingTotal - parseFloat(cashReceived.replace(',', '.') || '0'))}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer de confirmação */}
      <div className="px-4 py-4 border-t border-gray-100 bg-white">
        <button
          onClick={handleConfirm}
          disabled={confirming || !canConfirm || (method === 'pix' && !pixInfo?.pixKey)}
          className="w-full h-13 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 py-3.5 disabled:opacity-40 active:scale-98 transition-all"
          style={{ backgroundColor: 'var(--color-lime-primary, #84cc16)' }}
        >
          <CheckCircle2 className="w-5 h-5" />
          {confirming ? 'Processando...' : 'Confirmar pagamento recebido'}
        </button>
      </div>
    </div>
  )
}
