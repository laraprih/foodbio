'use client'

import React from 'react'
import { BarChart2, TrendingUp, TrendingDown, ShoppingBag, XCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { CashSession, ShiftSummary } from './types'

const METHOD_LABEL: Record<string, string> = {
  cash:        'Dinheiro',
  pix:         'PIX',
  credit_card: 'Crédito',
  debit_card:  'Débito',
  outro:       'Outro',
}

interface Props {
  cashSession: CashSession | null
}

export function PDVShiftSummary({ cashSession }: Props) {
  const { data, isLoading } = useQuery<ShiftSummary>({
    queryKey: ['pdv-shift-summary', cashSession?.id],
    queryFn: () => fetch(`/api/pdv/cash-session/${cashSession?.id}/summary`).then(r => r.json()),
    enabled: !!cashSession?.id,
    refetchInterval: 20_000,
  })

  if (!cashSession) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">Abra o caixa para ver o resumo do turno</p>
        </div>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-lime-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const openedAt = new Date(cashSession.openedAt)
  const hours = Math.floor((Date.now() - openedAt.getTime()) / 3_600_000)
  const minutes = Math.floor(((Date.now() - openedAt.getTime()) % 3_600_000) / 60_000)

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {/* Session header */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="font-black text-gray-900">Resumo do Turno</p>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">● Ativo</span>
          </div>
          <p className="text-xs text-gray-500">
            {cashSession.operatorName} · aberto às {openedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {' '}· {hours > 0 ? `${hours}h ` : ''}{minutes}min de turno
          </p>
        </div>

        {/* Order stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pedidos</p>
            </div>
            <p className="text-3xl font-black text-gray-900">{data.orders}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cancelados</p>
            </div>
            <p className="text-3xl font-black text-gray-900">{data.cancelled}</p>
          </div>
        </div>

        {/* Revenue by method */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Faturamento por Forma de Pagamento</p>
          <div className="space-y-3">
            {Object.entries(data.byMethod).map(([method, value]) => (
              <div key={method} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">{METHOD_LABEL[method] ?? method}</span>
                </div>
                <span className="text-sm font-black text-gray-900">R$ {Number(value).toFixed(2)}</span>
              </div>
            ))}
            {Object.keys(data.byMethod).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">Nenhuma venda ainda</p>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2.5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Totais</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-semibold">Faturamento bruto</span>
            <span className="font-black text-gray-900">R$ {data.grossTotal.toFixed(2)}</span>
          </div>
          {data.discounts > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="font-semibold">Descontos concedidos</span>
              <span className="font-black">-R$ {data.discounts.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black border-t border-gray-100 pt-2.5 text-gray-900">
            <span>Faturamento líquido</span>
            <span>R$ {data.netTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Cash movements */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Movimentações de Caixa</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-gray-700">Suprimentos</span>
              </div>
              <span className="text-sm font-black text-green-600">+R$ {data.supplies.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-gray-700">Sangrias</span>
              </div>
              <span className="text-sm font-black text-red-500">-R$ {data.bleeds.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Expected cash */}
        <div className="rounded-2xl p-5 border-2 shadow-sm" style={{ borderColor: 'var(--color-lime-primary)', backgroundColor: 'var(--color-lime-primary)/5' }}>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Saldo Esperado em Caixa</p>
          <p className="text-3xl font-black text-gray-900">R$ {data.expectedCash.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            Fundo inicial + vendas em dinheiro + suprimentos − sangrias
          </p>
        </div>
      </div>
    </div>
  )
}
