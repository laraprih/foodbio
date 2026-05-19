'use client'

import React from 'react'
import { Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { GarcomTable } from './types'

interface GarcomTableGridProps {
  tables: GarcomTable[]
  onSelectTable: (table: GarcomTable) => void
  isLoading?: boolean
}

const STATUS_STYLE: Record<string, string> = {
  free:            'bg-white border-gray-200 text-gray-700',
  occupied:        'bg-emerald-50 border-emerald-300 text-emerald-800',
  waiting_payment: 'bg-amber-50 border-amber-400 text-amber-800',
}

const STATUS_DOT: Record<string, string> = {
  free:            'bg-gray-300',
  occupied:        'bg-emerald-400',
  waiting_payment: 'bg-amber-400 animate-pulse',
}

const STATUS_LABEL: Record<string, string> = {
  free:            'Livre',
  occupied:        'Ocupada',
  waiting_payment: 'Aguard. pagamento',
}

export function GarcomTableGrid({ tables, onSelectTable, isLoading }: GarcomTableGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 p-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!tables.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Users className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">Nenhuma mesa cadastrada</p>
        <p className="text-xs mt-1">Adicione mesas no painel admin</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      {tables.map(table => (
        <button
          key={table.id}
          onClick={() => onSelectTable(table)}
          className={`
            relative flex flex-col items-center justify-center
            rounded-2xl border-2 p-3 min-h-[96px]
            transition-all duration-150 active:scale-95 shadow-sm
            ${STATUS_STYLE[table.status] ?? STATUS_STYLE.free}
          `}
        >
          {/* Status dot */}
          <span className={`absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full ${STATUS_DOT[table.status]}`} />

          {/* Table number */}
          <span className="text-2xl font-black leading-none">{table.number}</span>

          {/* Label */}
          {table.label && (
            <span className="text-[10px] font-medium mt-0.5 opacity-70 truncate max-w-full px-1">
              {table.label}
            </span>
          )}

          {/* Capacity */}
          <span className="flex items-center gap-0.5 text-[10px] opacity-50 mt-1">
            <Users className="w-2.5 h-2.5" />
            {table.capacity}
          </span>

          {/* Pending total */}
          {table.status !== 'free' && Number(table.pending_total) > 0 && (
            <span className="text-[11px] font-semibold mt-1.5">
              {formatCurrency(Number(table.pending_total))}
            </span>
          )}

          {/* Status label */}
          <span className="text-[9px] font-medium opacity-60 mt-0.5">
            {STATUS_LABEL[table.status]}
          </span>
        </button>
      ))}
    </div>
  )
}
