'use client'

import React from 'react'
import { ChevronLeft, LogOut, UtensilsCrossed } from 'lucide-react'

interface GarcomNavbarProps {
  tenantName: string
  waiterName: string
  onBack?: () => void
  backLabel?: string
  title?: string
  onLogout: () => void
}

export function GarcomNavbar({
  tenantName,
  waiterName,
  onBack,
  backLabel,
  title,
  onLogout,
}: GarcomNavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center h-14 px-4 gap-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-gray-600 font-medium text-sm -ml-1 py-2 pr-2"
          >
            <ChevronLeft className="w-5 h-5" />
            {backLabel ?? 'Mesas'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-lime-primary, #84cc16)' }}>
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm leading-tight truncate max-w-[120px]">
              {tenantName}
            </span>
          </div>
        )}

        <div className="flex-1 text-center">
          {title && (
            <span className="font-semibold text-gray-900 text-sm">{title}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[80px]">
            {waiterName}
          </span>
          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
