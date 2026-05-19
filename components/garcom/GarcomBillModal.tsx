'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  X, QrCode, CreditCard, Banknote, CheckCircle2,
  Copy, Check, Clock, ChevronDown, ChevronUp, Loader2,
  RefreshCw, AlertCircle,
} from 'lucide-react'
import { formatCurrency, formatOrderTime } from '@/lib/utils'
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { GarcomTable, GarcomOrder } from './types'

type PayMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash'

interface GarcomBillModalProps {
  table: GarcomTable
  orders: GarcomOrder[]
  pendingTotal: number
  onClose: () => void
  /** chamado para cartão/dinheiro — PIX é auto-confirmado via webhook */
  onConfirm: (method: PayMethod) => Promise<void>
}

interface PixPayment {
  paymentId: string
  qrCode: string
  qrCodeBase64: string
  total: number
}

const METHOD_OPTIONS: { id: PayMethod; label: string; icon: React.ElementType }[] = [
  { id: 'pix',         label: 'PIX',     icon: QrCode     },
  { id: 'credit_card', label: 'Crédito', icon: CreditCard },
  { id: 'debit_card',  label: 'Débito',  icon: CreditCard },
  { id: 'cash',        label: 'Dinheiro', icon: Banknote   },
]

const POLL_INTERVAL = 4_000  // 4s entre polls de confirmação

export function GarcomBillModal({
  table,
  orders,
  pendingTotal,
  onClose,
  onConfirm,
}: GarcomBillModalProps) {
  const [method, setMethod]             = useState<PayMethod>('pix')
  const [cashReceived, setCashReceived] = useState('')
  const [copied, setCopied]             = useState(false)
  const [confirming, setConfirming]     = useState(false)
  const [paid, setPaid]                 = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // PIX state
  const [pixLoading, setPixLoading]     = useState(false)
  const [pixPayment, setPixPayment]     = useState<PixPayment | null>(null)
  const [pixError, setPixError]         = useState<string | null>(null)
  const [polling, setPolling]           = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Gera QR code MP assim que o método PIX é selecionado
  useEffect(() => {
    if (method !== 'pix' || pixPayment || pixLoading) return
    generatePixPayment()
  }, [method]) // eslint-disable-line react-hooks/exhaustive-deps

  // Inicia polling quando o QR code estiver pronto
  useEffect(() => {
    if (!pixPayment) return
    startPolling()
    return () => stopPolling()
  }, [pixPayment]) // eslint-disable-line react-hooks/exhaustive-deps

  async function generatePixPayment() {
    setPixLoading(true)
    setPixError(null)
    try {
      const res = await fetch('/api/garcom/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: table.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar PIX')
      setPixPayment(data)
    } catch (err: any) {
      setPixError(err.message ?? 'Falha ao criar cobrança PIX')
    } finally {
      setPixLoading(false)
    }
  }

  function startPolling() {
    if (pollRef.current) return
    setPolling(true)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/garcom/payment-status?tableId=${table.id}`)
        const data = await res.json()
        if (data.paid) {
          stopPolling()
          setPaid(true)
        }
      } catch { /* ignora erros de rede durante polling */ }
    }, POLL_INTERVAL)
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setPolling(false)
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const troco = (() => {
    const recv = parseFloat(cashReceived.replace(',', '.'))
    if (isNaN(recv) || recv < pendingTotal) return null
    return recv - pendingTotal
  })()

  const handleConfirmManual = async () => {
    if (confirming) return
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
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
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
      <header className="flex items-center h-14 px-4 gap-3 border-b border-gray-100 shrink-0">
        <button onClick={onClose} className="p-2 -ml-1 rounded-full hover:bg-gray-100">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <p className="font-black text-gray-900 leading-tight">Conta — Mesa {table.number}</p>
          <p className="text-xs text-gray-400">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>
        </div>
        <p className="text-xl font-black text-gray-900">{formatCurrency(pendingTotal)}</p>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Resumo dos pedidos (expansível) */}
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
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
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
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 divide-y divide-gray-100">
                      {(order.items ?? []).map(item => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs font-bold text-gray-400 w-5 text-center">{item.quantity}×</span>
                          <p className="flex-1 text-sm font-medium text-gray-800 truncate">{item.name}</p>
                          <span className="text-sm font-semibold text-gray-700 shrink-0">{formatCurrency(item.totalPrice)}</span>
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
        <div className="px-4 pt-1 pb-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Forma de pagamento</p>
          <div className="grid grid-cols-4 gap-2">
            {METHOD_OPTIONS.map(opt => {
              const Icon = opt.icon
              const active = method === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => { setMethod(opt.id); setPixPayment(null); setPixError(null) }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all',
                    active ? 'border-lime-400 bg-lime-50 text-lime-800' : 'border-gray-100 bg-gray-50 text-gray-500'
                  )}
                >
                  <Icon className={cn('w-5 h-5', active ? 'text-lime-600' : 'text-gray-400')} />
                  <span className="text-[10px] font-bold leading-tight">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── PIX via MercadoPago ── */}
        {method === 'pix' && (
          <div className="px-4 py-3 flex flex-col items-center gap-3">
            {pixLoading && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-8 h-8 text-lime-500 animate-spin" />
                <p className="text-sm text-gray-500">Gerando cobrança PIX…</p>
              </div>
            )}

            {pixError && (
              <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Erro ao gerar PIX</p>
                    <p className="text-xs text-red-600 mt-0.5">{pixError}</p>
                  </div>
                </div>
                <button
                  onClick={generatePixPayment}
                  className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
                </button>
              </div>
            )}

            {pixPayment && !pixLoading && (
              <>
                {/* QR code real do MP */}
                <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-100 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${pixPayment.qrCodeBase64}`}
                    alt="QR Code PIX MercadoPago"
                    width={240}
                    height={240}
                    className="rounded-xl"
                  />
                  {polling && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 rounded-full px-2 py-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-gray-500">aguardando</span>
                    </div>
                  )}
                </div>

                {/* Valor */}
                <div className="text-center">
                  <p className="text-xs text-gray-400">Valor a pagar</p>
                  <p className="text-2xl font-black text-gray-900">{formatCurrency(pixPayment.total)}</p>
                </div>

                {/* Copia-e-cola */}
                <button
                  onClick={() => handleCopy(pixPayment.qrCode)}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 active:scale-95 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado!' : 'Copiar código PIX'}
                </button>

                {/* Status de espera */}
                <div className="w-full bg-lime-50 border border-lime-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-lime-600 animate-spin shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-lime-800">Aguardando pagamento</p>
                    <p className="text-[11px] text-lime-600">Confirmação automática após o pagamento</p>
                  </div>
                </div>

                {/* Botão manual de fallback */}
                <button
                  onClick={() => setPaid(true)}
                  className="text-xs text-gray-400 underline underline-offset-2"
                >
                  Já recebi o pagamento manualmente
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Cartão ── */}
        {(method === 'credit_card' || method === 'debit_card') && (
          <div className="px-4 py-6 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-base font-bold text-gray-900">
              {method === 'credit_card' ? 'Crédito' : 'Débito'}
            </p>
            <p className="text-3xl font-black text-gray-900">{formatCurrency(pendingTotal)}</p>
            <p className="text-xs text-gray-400 text-center">
              Passe o cartão na maquininha e confirme abaixo.
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
                Valor insuficiente — faltam{' '}
                {formatCurrency(pendingTotal - parseFloat(cashReceived.replace(',', '.') || '0'))}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer — botão de confirmação manual (cartão e dinheiro) */}
      {method !== 'pix' && (
        <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
          <button
            onClick={handleConfirmManual}
            disabled={confirming || (method === 'cash' && troco === null)}
            className="w-full h-12 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-98 transition-all"
            style={{ backgroundColor: 'var(--color-lime-primary, #84cc16)' }}
          >
            {confirming
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle2 className="w-5 h-5" />
            }
            {confirming ? 'Processando…' : 'Confirmar pagamento recebido'}
          </button>
        </div>
      )}
    </div>
  )
}
