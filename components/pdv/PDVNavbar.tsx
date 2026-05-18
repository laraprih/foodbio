'use client'

import React from 'react'
import {
  LayoutGrid, TableProperties, ClipboardList,
  Receipt, BarChart2, LogOut,
} from 'lucide-react'
import type { PDVModule } from './types'

const NAV_ITEMS: { module: PDVModule; icon: React.ElementType; label: string }[] = [
  { module: 'catalog', icon: LayoutGrid,       label: 'Cardápio' },
  { module: 'tables',  icon: TableProperties,  label: 'Mesas' },
  { module: 'orders',  icon: ClipboardList,    label: 'Pedidos' },
  { module: 'cash',    icon: Receipt,          label: 'Caixa' },
  { module: 'summary', icon: BarChart2,        label: 'Resumo' },
]

interface Props {
  active: PDVModule
  onNavigate: (m: PDVModule) => void
  onLogout: () => void
  hasCashSession: boolean
}

export function PDVNavbar({ active, onNavigate, onLogout, hasCashSession }: Props) {
  return (
    <nav className="w-14 bg-gray-900 flex flex-col items-center py-3 gap-1 shrink-0 select-none">
      {NAV_ITEMS.map(({ module, icon: Icon, label }) => {
        const isActive = active === module
        const needsCash = module !== 'cash' && !hasCashSession
        return (
          <button
            key={module}
            title={label}
            onClick={() => onNavigate(module)}
            className={`relative group w-10 h-10 rounded-xl flex items-center justify-center transition-all
              ${isActive
                ? 'text-gray-900'
                : needsCash
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            style={isActive ? { backgroundColor: 'var(--color-lime-primary)' } : {}}
            disabled={needsCash}
          >
            <Icon className="w-5 h-5" />
            <span className="absolute left-12 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
              {needsCash ? `${label} (abrir caixa primeiro)` : label}
            </span>
          </button>
        )
      })}

      <div className="flex-1" />

      <button
        title="Sair do PDV"
        onClick={onLogout}
        className="group relative w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-red-900/60 hover:text-red-300 transition-all"
      >
        <LogOut className="w-5 h-5" />
        <span className="absolute left-12 bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
          Sair
        </span>
      </button>
    </nav>
  )
}
