'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { get, isApiError } from '@/lib/api-client'
import { TrendingUp, DollarSign, ShoppingBag, BarChart3, Download } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

type Period = '7d' | '30d' | '90d'

interface SalesReport {
  period: Period
  totalRevenue: number
  orderCount: number
  averageTicket: number
  topProducts: { name: string; quantity: number; revenue: number }[]
  byDay: { date: string; revenue: number; orders: number }[]
}

export default function RelatoriosPage() {
  const [period, setPeriod] = useState<Period>('30d')

  const { data: report, isLoading } = useQuery({
    queryKey: ['sales-report', period],
    queryFn: () => get<SalesReport>(`/bff/api/admin/reports/sales?period=${period}`),
  })

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const r = isApiError(report) || !report ? null : report

  const maxRevenue = r?.byDay?.length
    ? Math.max(...r.byDay.map((d) => d.revenue), 1)
    : 1

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Relatórios</h1>
          <p className="text-gray-500 font-medium">Análise de vendas e performance.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 mb-8">
        {(['7d', '30d', '90d'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'px-5 py-2.5 rounded-2xl text-sm font-bold transition-colors',
              period === p
                ? 'bg-zinc-900 text-[var(--color-lime-primary)]'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400'
            )}
          >
            {p === '7d' ? 'Últimos 7 dias' : p === '30d' ? 'Últimos 30 dias' : 'Últimos 90 dias'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Faturamento', value: fmt(r?.totalRevenue ?? 0), icon: DollarSign },
              { label: 'Pedidos', value: String(r?.orderCount ?? 0), icon: ShoppingBag },
              { label: 'Ticket Médio', value: fmt(r?.averageTicket ?? 0), icon: TrendingUp },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-[28px] border border-black/5 p-6 shadow-sm">
                <div className="w-12 h-12 bg-[var(--color-app-bg)] rounded-2xl flex items-center justify-center mb-4">
                  <card.icon className="w-5 h-5 text-[var(--color-app-dark)]" />
                </div>
                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          {r?.byDay && r.byDay.length > 0 && (
            <div className="bg-white rounded-[28px] border border-black/5 shadow-sm p-6 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-gray-400" />
                <h2 className="font-black text-gray-900">Faturamento por dia</h2>
              </div>
              <div className="flex items-end gap-1.5 h-32">
                {r.byDay.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full bg-[var(--color-lime-primary)] rounded-t-lg transition-all group-hover:opacity-80"
                      style={{ height: `${(day.revenue / maxRevenue) * 100}%`, minHeight: day.revenue > 0 ? '4px' : '0' }}
                      title={`${day.date}: ${fmt(day.revenue)}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400 font-medium">
                  {r.byDay[0]?.date ? new Date(r.byDay[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {r.byDay[r.byDay.length - 1]?.date
                    ? new Date(r.byDay[r.byDay.length - 1].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                    : ''}
                </span>
              </div>
            </div>
          )}

          {/* Top products */}
          {r?.topProducts && r.topProducts.length > 0 && (
            <div className="bg-white rounded-[28px] border border-black/5 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="font-black text-gray-900">Produtos mais vendidos</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {r.topProducts.map((product, idx) => (
                  <div key={product.name} className="px-6 py-4 flex items-center gap-4">
                    <span className="w-7 h-7 rounded-xl bg-zinc-900 text-[var(--color-lime-primary)] font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-bold text-gray-900 text-sm">{product.name}</span>
                    <span className="text-sm text-gray-400 font-medium">{product.quantity}x</span>
                    <span className="font-black text-gray-900 text-sm">{fmt(product.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!r && (
            <div className="text-center py-16 text-gray-400 font-medium">
              Nenhum dado disponível para este período.
            </div>
          )}
        </>
      )}
    </div>
  )
}
