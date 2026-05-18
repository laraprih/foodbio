'use client'

import React, { useState } from 'react'
import { Receipt, TrendingDown, TrendingUp, Lock, Unlock, AlertTriangle } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CashSession, CashMovement } from './types'
import { toast } from 'react-hot-toast'

async function pdvPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Erro interno')
  return data
}

interface Props {
  cashSession: CashSession | null
  onSessionChange: (s: CashSession | null) => void
}

export function PDVCashDrawer({ cashSession, onSessionChange }: Props) {
  const qc = useQueryClient()
  const [initialAmount, setInitialAmount] = useState('')
  const [closeAmount, setCloseAmount] = useState('')
  const [movType, setMovType] = useState<'bleed' | 'supply'>('bleed')
  const [movAmount, setMovAmount] = useState('')
  const [movReason, setMovReason] = useState('')
  const [tab, setTab] = useState<'movements' | 'close'>('movements')

  const { data: movements = [] } = useQuery<CashMovement[]>({
    queryKey: ['pdv-movements', cashSession?.id],
    queryFn: async () => {
      if (!cashSession) return []
      const res = await fetch(`/api/pdv/cash-session/${cashSession.id}/summary`)
      const data = await res.json()
      return data.movements ?? []
    },
    enabled: !!cashSession,
    refetchInterval: 15_000,
  })

  const openMutation = useMutation({
    mutationFn: () => pdvPost<{ session: CashSession }>('/api/pdv/cash-session/open', {
      initialAmount: parseFloat(initialAmount.replace(',', '.')) || 0,
    }),
    onSuccess: ({ session }) => {
      onSessionChange(session)
      qc.invalidateQueries({ queryKey: ['pdv-cash-session'] })
      toast.success('Caixa aberto!')
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao abrir caixa'),
  })

  const closeMutation = useMutation({
    mutationFn: () => pdvPost<{ session: CashSession }>('/api/pdv/cash-session/close', {
      sessionId: cashSession?.id,
      closeAmount: parseFloat(closeAmount.replace(',', '.')) || 0,
    }),
    onSuccess: () => {
      onSessionChange(null)
      qc.invalidateQueries({ queryKey: ['pdv-cash-session'] })
      toast.success('Caixa fechado!')
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao fechar caixa'),
  })

  const movMutation = useMutation({
    mutationFn: () => pdvPost('/api/pdv/cash-session/movement', {
      sessionId: cashSession?.id,
      type: movType,
      amount: parseFloat(movAmount.replace(',', '.')) || 0,
      reason: movReason,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdv-movements'] })
      setMovAmount('')
      setMovReason('')
      toast.success(movType === 'bleed' ? 'Sangria registrada' : 'Suprimento registrado')
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao registrar movimentação'),
  })

  if (!cashSession) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Unlock className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-black text-gray-900">Abrir Caixa</h2>
            <p className="text-sm text-gray-500 mt-1">Informe o fundo de troco inicial</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Valor inicial (fundo de caixa)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
              <input
                type="number"
                inputMode="decimal"
                value={initialAmount}
                onChange={e => setInitialAmount(e.target.value)}
                placeholder="0,00"
                className="w-full bg-gray-50 rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-xl font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
              />
            </div>
          </div>
          <button
            onClick={() => openMutation.mutate()}
            disabled={openMutation.isPending}
            className="w-full py-4 rounded-xl font-black text-gray-900 text-base disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--color-lime-primary)' }}
          >
            {openMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Unlock className="w-5 h-5" />
                Abrir Caixa
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  const openedAt = new Date(cashSession.openedAt)
  const totalMovs = movements.reduce((s: number, m: CashMovement) =>
    m.type === 'bleed' ? s - m.amount : s + m.amount, 0
  )

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto no-scrollbar">
      <div className="p-6 max-w-2xl mx-auto w-full space-y-4">
        {/* Session info */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-lime-primary)' }}>
                <Receipt className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <p className="font-black text-gray-900">Caixa Aberto</p>
                <p className="text-xs text-gray-500">{cashSession.operatorName} · {openedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">● Ativo</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-semibold">Fundo inicial</p>
              <p className="text-lg font-black text-gray-900">R$ {cashSession.initialAmount.toFixed(2)}</p>
            </div>
            <div className={`rounded-xl p-3 ${totalMovs >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-xs font-semibold ${totalMovs >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                Movimentações
              </p>
              <p className={`text-lg font-black ${totalMovs >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {totalMovs >= 0 ? '+' : ''}R$ {totalMovs.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('movements')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'movements' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            Sangria / Suprimento
          </button>
          <button
            onClick={() => setTab('close')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'close' ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            Fechar Caixa
          </button>
        </div>

        {tab === 'movements' && (
          <div className="space-y-4">
            {/* New movement */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <p className="font-black text-gray-900 text-sm">Nova Movimentação</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMovType('bleed')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    movType === 'bleed'
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  Sangria
                </button>
                <button
                  onClick={() => setMovType('supply')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    movType === 'supply'
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Suprimento
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={movAmount}
                  onChange={e => setMovAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-gray-50 rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-lg font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                />
              </div>
              <input
                type="text"
                value={movReason}
                onChange={e => setMovReason(e.target.value)}
                placeholder="Motivo (obrigatório)"
                className="w-full bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
              />
              <button
                onClick={() => movMutation.mutate()}
                disabled={movMutation.isPending || !movAmount || !movReason.trim()}
                className="w-full py-3 rounded-xl text-sm font-black text-gray-900 disabled:opacity-40 transition-all"
                style={{ backgroundColor: 'var(--color-lime-primary)' }}
              >
                {movMutation.isPending ? 'Registrando...' : 'Registrar'}
              </button>
            </div>

            {/* History */}
            {movements.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
                <p className="font-black text-gray-900 text-sm mb-3">Histórico do turno</p>
                {movements.map((m: CashMovement) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{m.reason}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-sm font-black ${m.type === 'bleed' ? 'text-red-500' : 'text-green-600'}`}>
                      {m.type === 'bleed' ? '-' : '+'}R$ {m.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'close' && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-xs font-semibold text-amber-700">
                Após fechar o caixa, nenhuma venda poderá ser realizada até a próxima abertura.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Valor contado fisicamente
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={closeAmount}
                  onChange={e => setCloseAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-gray-50 rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-xl font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                />
              </div>
            </div>
            <button
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending || !closeAmount}
              className="w-full py-4 rounded-xl font-black text-white text-base bg-red-600 hover:bg-red-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {closeMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Fechar Caixa
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
