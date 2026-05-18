'use client'

import React, { useState } from 'react'
import { Plus, Users, TableProperties, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PDVTable } from './types'
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

const STATUS_CONFIG = {
  free:            { label: 'Livre',              bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  dot: 'bg-green-400' },
  occupied:        { label: 'Ocupada',            bg: 'bg-amber-50',  border: 'border-amber-300', text: 'text-amber-700',  dot: 'bg-amber-400' },
  waiting_payment: { label: 'Aguardando pgto.',   bg: 'bg-red-50',    border: 'border-red-300',   text: 'text-red-700',    dot: 'bg-red-400'   },
}

interface Props {
  onSelectTable: (tableId: string) => void
}

export function PDVTables({ onSelectTable }: Props) {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [newNumber, setNewNumber] = useState('')
  const [newCapacity, setNewCapacity] = useState('4')
  const [newLabel, setNewLabel] = useState('')

  const { data, isLoading } = useQuery<{ tables: PDVTable[] }>({
    queryKey: ['pdv-tables'],
    queryFn: () => fetch('/api/pdv/tables').then(r => r.json()),
    refetchInterval: 10_000,
  })

  const tables = data?.tables ?? []

  const addMutation = useMutation({
    mutationFn: () => pdvPost('/api/pdv/tables', {
      number: parseInt(newNumber),
      capacity: parseInt(newCapacity),
      label: newLabel.trim() || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdv-tables'] })
      setShowAdd(false)
      setNewNumber('')
      setNewCapacity('4')
      setNewLabel('')
      toast.success('Mesa criada')
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao criar mesa'),
  })

  const patchMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/pdv/tables/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pdv-tables'] }),
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-lime-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-black text-gray-900 text-lg">Mesas</h2>
          <p className="text-xs text-gray-500">{tables.filter(t => t.status === 'free').length} livres · {tables.filter(t => t.status !== 'free').length} ocupadas</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-900 transition-all"
          style={{ backgroundColor: 'var(--color-lime-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Nova Mesa
        </button>
      </div>

      {/* Add table form */}
      {showAdd && (
        <div className="mx-6 mt-4 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-gray-900 text-sm">Adicionar Mesa</p>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Número</label>
              <input
                type="number"
                value={newNumber}
                onChange={e => setNewNumber(e.target.value)}
                placeholder="1"
                className="w-full bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Capacidade</label>
              <input
                type="number"
                value={newCapacity}
                onChange={e => setNewCapacity(e.target.value)}
                placeholder="4"
                className="w-full bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nome (opcional)</label>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="Varanda"
                className="w-full bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
              />
            </div>
          </div>
          <button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || !newNumber}
            className="w-full py-2.5 rounded-xl text-sm font-black text-gray-900 disabled:opacity-40 transition-all"
            style={{ backgroundColor: 'var(--color-lime-primary)' }}
          >
            {addMutation.isPending ? 'Criando...' : 'Criar Mesa'}
          </button>
        </div>
      )}

      {/* Tables grid */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <TableProperties className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma mesa cadastrada</p>
            <p className="text-xs mt-1">Clique em "Nova Mesa" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {tables.map(table => {
              const cfg = STATUS_CONFIG[table.status as keyof typeof STATUS_CONFIG]
              return (
                <div
                  key={table.id}
                  className={`relative rounded-2xl p-4 border-2 cursor-pointer transition-all group ${cfg.bg} ${cfg.border} hover:shadow-md`}
                  onClick={() => {
                    if (table.status === 'free') {
                      onSelectTable(table.id)
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-black text-gray-900">#{table.number}</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  </div>
                  {table.label && (
                    <p className="text-xs font-semibold text-gray-600 mb-1">{table.label}</p>
                  )}
                  <div className="flex items-center gap-1 mb-3">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{table.capacity} pessoas</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${cfg.text}`}>
                    {cfg.label}
                  </span>

                  {/* Quick actions */}
                  {table.status !== 'free' && (
                    <div className="absolute inset-0 bg-white/90 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-center justify-center p-3">
                      <button
                        onClick={e => { e.stopPropagation(); patchMutation.mutate({ id: table.id, status: 'waiting_payment' }) }}
                        className="w-full py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold"
                      >
                        Aguardando pgto.
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); patchMutation.mutate({ id: table.id, status: 'free' }) }}
                        className="w-full py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold"
                      >
                        Liberar mesa
                      </button>
                    </div>
                  )}
                  {table.status === 'free' && (
                    <div className="absolute inset-0 bg-gray-900/80 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-black">Abrir comanda</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
