'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { get, isApiError } from '@/lib/api-client'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import Spinner from '@/components/ui/Spinner'

interface FinanceiroSummary {
  totalRevenue: number
  totalFees: number
  totalPayout: number
  pendingCount: number
  approvedCount: number
  refundedCount: number
  gateway: string | null
  connected: boolean
}

export default function FinanceiroPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['financeiro-summary'],
    queryFn: () => get<FinanceiroSummary>('/bff/api/admin/reports/summary'),
  })

  const { data: transactions, isLoading: loadingTx } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => get<any[]>('/bff/api/admin/reports/splits'),
  })

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const s = isApiError(summary) || !summary ? null : summary

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financeiro</h1>
          <p className="text-gray-500 font-medium">Repasses, comissões e status de pagamentos.</p>
        </div>
        {!s?.connected && (
          <Link
            href="/financeiro/conectar"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 text-[var(--color-lime-primary)] font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Conectar Gateway
          </Link>
        )}
      </div>

      {/* Connection status */}
      <div className={`flex items-center gap-4 p-5 rounded-[28px] border mb-8 ${s?.connected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        {s?.connected ? (
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
        )}
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">
            {s?.connected ? `Gateway conectado: ${s.gateway?.toUpperCase()}` : 'Nenhum gateway conectado'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {s?.connected
              ? 'Pagamentos e split automático ativos.'
              : 'Conecte um gateway para processar pagamentos com split automático.'}
          </p>
        </div>
        {!s?.connected && (
          <Link href="/financeiro/conectar" className="text-sm font-bold text-yellow-700 flex items-center gap-1 hover:underline">
            Configurar <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Faturamento Total', value: fmt(s?.totalRevenue ?? 0), icon: DollarSign, color: 'bg-green-50 text-green-600' },
          { label: 'Comissão Plataforma', value: fmt(s?.totalFees ?? 0), icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
          { label: 'Repasse Líquido', value: fmt(s?.totalPayout ?? 0), icon: DollarSign, color: 'bg-[var(--color-app-bg)] text-[var(--color-app-dark)]' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-[28px] border border-black/5 p-6 shadow-sm">
            <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center mb-4`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500 font-medium">{card.label}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { label: 'Aprovados', count: s?.approvedCount ?? 0, color: 'bg-green-100 text-green-700' },
          { label: 'Pendentes', count: s?.pendingCount ?? 0, color: 'bg-yellow-100 text-yellow-700' },
          { label: 'Estornados', count: s?.refundedCount ?? 0, color: 'bg-red-100 text-red-600' },
        ].map((pill) => (
          <div key={pill.label} className={`px-4 py-2 rounded-full text-sm font-bold ${pill.color}`}>
            {pill.count} {pill.label}
          </div>
        ))}
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-[28px] border border-black/5 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-black text-gray-900">Últimas transações</h2>
        </div>
        {loadingTx ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(!transactions || isApiError(transactions) || transactions.length === 0) ? (
              <p className="text-center py-12 text-gray-400 text-sm font-medium">
                Nenhuma transação registrada ainda.
              </p>
            ) : (
              transactions.map((tx: any) => (
                <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Pedido #{tx.orderId.slice(-6)}</p>
                    <p className="text-xs text-gray-400 font-medium capitalize">{tx.gateway}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900 text-sm">{fmt(tx.totalAmount)}</p>
                    <p className={`text-xs font-bold capitalize ${
                      tx.splitStatus === 'done' ? 'text-green-600' :
                      tx.splitStatus === 'pending' ? 'text-yellow-600' :
                      'text-red-500'
                    }`}>{tx.splitStatus}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
